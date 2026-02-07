import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guarda } from './entities/guarda.entity';
import { EnderecoId } from './entities/endereco-id.entity';
import { Compra } from 'src/compra/entities/compra.entity';
import { Estoquista } from 'src/estoquista/entities/estoquista.entity';
import { ProdNfc } from 'src/prod_nfc/entities/prod_nfc.entity';
import { Fornecedor } from 'src/fornecedor/entities/fornecedor.entity';
import { Produto } from 'src/produtos/entities/produto.entity';
import { PrdLoja } from 'src/prd_loja/entities/prd_loja.entity';
import { ProdutosGuarda } from 'src/produtos_guarda/entities/produtos_guarda.entity';
import { GuardaProdService } from 'src/guarda_prod/guarda/guarda_prod.service';
import { CreateGuardaSeederDto } from './dto/create-guarda.dto';
import { create } from 'axios';

// Interfaces para tipagem
export interface ProdutoFormatado {
  id: number;
  cd_produto: string;
  no_produto: string;
  quantidade: number;
  qtde_bipada: number;
  cod_barras: string[];
  endereco: string;
  cd_fabrica: string;
  id_endereco: string;
  item: string;
  bipado: boolean;
}

export interface GuardaFormatada {
  sq_guarda: string;
  nu_nota: string;
  sg_serie: string;
  cd_fornece: string;
  fornecedor: string;
  dt_entrada: string;
  hr_entrada: string;
  dt_iniguar: string;
  hr_iniguar: string;
  dt_fimguar: string;
  hr_fimguar: string;
  SKUs: number;
  status: string;
}

@Injectable()
export class GuardaService {
  private readonly CD_LOJA_PADRAO = '01';
  private readonly logger = new Logger(GuardaService.name);

  constructor(
    @InjectRepository(Guarda)
    private readonly guardaRepository: Repository<Guarda>,
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    @InjectRepository(Estoquista)
    private readonly estoquistaRepository: Repository<Estoquista>,
    @InjectRepository(ProdNfc)
    private readonly prodNfcRepository: Repository<ProdNfc>,
    @InjectRepository(Fornecedor)
    private readonly fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(PrdLoja)
    private readonly prdLojaRepository: Repository<PrdLoja>,
    @InjectRepository(ProdutosGuarda)
    private readonly produtosGuardaRepository: Repository<ProdutosGuarda>,
    @InjectRepository(EnderecoId)
    private readonly enderecoIdRepository: Repository<EnderecoId>,
    private readonly guardaProdService: GuardaProdService,
  ) {}

  // ==================== MÉTODOS PÚBLICOS ====================

  async createGuarda(createGuardaSeederDto: CreateGuardaSeederDto) {
    this.log(`Criando guarda: ${JSON.stringify(createGuardaSeederDto)}`);

    const estoquista = await this.estoquistaRepository.findOne({
      where: { codoper: createGuardaSeederDto.codoper },
    });

    if (!estoquista) {
      throw new NotFoundException(
        `Estoquista com codoper ${createGuardaSeederDto.codoper} não encontrado`,
      );
    }

    const guarda = await this.buildGuarda(createGuardaSeederDto, estoquista);
    await this.associateGuardaToEstoquista(guarda, estoquista);
    await this.guardaRepository.save(guarda);

    return {
      success: true,
      data: {
        guarda,
      },
    };
  }

  private log(message: string, context?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(message, context);
    }
  }

  private logError(message: string, trace?: string) {
    this.logger.error(message, trace);
  }

  async findAllByUser(cdUsuario?: string) {
    this.log(`Buscando guardas para usuário ${cdUsuario}`);
    const guardas = await this.findGuardasByUser(cdUsuario);
    const formatted = await this.formatGuardasList(guardas);
    this.log(`Guardas encontradas: ${JSON.stringify(formatted)}`);
    return this.buildSuccessResponse(formatted, guardas[0]?.cd_loja);
  }

  async findOne(sqGuarda: number) {
    const guarda = await this.findGuardaById(sqGuarda);
    const compra = guarda.compra?.[0];

    const nomeFornecedor = await this.getNomeFornecedor(
      compra?.codfor || guarda.cd_fornece,
    );

    // Se a guarda for do SIAC, buscar produtos de ProdutosGuarda
    let produtosFormatados: ProdutoFormatado[];
    if (guarda.sq_guarda_siac) {
      const produtosGuarda = await this.produtosGuardaRepository.find({
        where: { sq_guarda: guarda.sq_guarda },
      });
      produtosFormatados = await this.formatProdutosGuarda(produtosGuarda);
    } else {
      // Guarda local - buscar de ProdNfc via Compra
      const produtos = compra?.produtos || [];
      produtosFormatados = await this.formatProdutos(produtos);
    }

    return this.buildGuardaDetailResponse(
      guarda,
      compra,
      nomeFornecedor,
      produtosFormatados,
    );
  }

  async iniciar(sqGuarda: number) {
    this.log(`Iniciando guarda ${sqGuarda}`);
    const guarda = await this.findGuardaByIdSimple(sqGuarda);
    this.log(`Guarda encontrada: ${JSON.stringify(guarda)}`);

    // Se for guarda de produção (SIAC), chamar API do SIAC
    if (
      guarda.sq_guarda_siac &&
      (process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'stage')
    ) {
      this.log(
        `Guarda ${sqGuarda} é de produção (SIAC: ${guarda.sq_guarda_siac}). Chamando API SIAC...`,
      );
      try {
        await this.guardaProdService.iniciarGuarda(guarda.sq_guarda_siac);
        guarda.dt_iniguar = new Date();
        guarda.hr_iniguar = this.getCurrentTime();
        this.log(
          `API SIAC iniciarGuarda chamada com sucesso para ${guarda.sq_guarda_siac}`,
        );
      } catch (error) {
        this.logError(
          `Erro ao chamar API SIAC iniciarGuarda: ${error.message}`,
        );
        throw error;
      }
    }

    guarda.dt_iniguar = new Date();
    guarda.hr_iniguar = this.getCurrentTime();

    await this.guardaRepository.save(guarda);

    return this.buildIniciarResponse(guarda);
  }

  async finalizar(sqGuarda: number) {
    this.log(`Finalizando guarda ${sqGuarda}`);
    const guarda = await this.findGuardaByIdSimple(sqGuarda);

    // Se for guarda de produção (SIAC), chamar API do SIAC
    if (guarda.sq_guarda_siac) {
      this.log(
        `Guarda ${sqGuarda} é de produção (SIAC: ${guarda.sq_guarda_siac}). Chamando API SIAC...`,
      );
      try {
        await this.guardaProdService.finalizarGuarda(guarda.sq_guarda_siac);
        guarda.dt_fimguar = new Date();
        guarda.hr_fimguar = this.getCurrentTime();
        guarda.in_fimapp = 'S';
        this.log(
          `API SIAC finalizarGuarda chamada com sucesso para ${guarda.sq_guarda_siac}`,
        );
      } catch (error) {
        this.logError(
          `Erro ao chamar API SIAC finalizarGuarda: ${error.message}`,
        );
        throw error;
      }
    }

    guarda.dt_fimguar = new Date();
    guarda.hr_fimguar = this.getCurrentTime();
    guarda.in_fimapp = 'S';

    await this.guardaRepository.save(guarda);

    return this.buildFinalizarResponse(guarda);
  }

  async marcarBipado(
    produtoId: number,
    dados?: { quantidade?: number; endereco?: string; guardaId?: number },
  ) {
    this.logger.log(`[BIPAR] Iniciando bipagem do produto ID=${produtoId}`, {
      dados,
    });

    // Primeiro tentar buscar em ProdutosGuarda (guardas do SIAC)
    // Tentar buscar por ID direto primeiro
    // DEBUG DB INFO
    const dbName =
      this.produtosGuardaRepository.manager.connection.options.database;
    this.logger.log(
      `[DEBUG_DB] NODE_ENV: ${process.env.NODE_ENV}, DB: ${dbName}`,
    );

    let produtoGuarda = await this.produtosGuardaRepository.findOne({
      where: { id: produtoId },
    });

    this.logger.log(
      `[BIPAR] Resultado busca ProdutosGuarda por ID ${produtoId}: ${produtoGuarda ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`,
    );

    if (produtoGuarda) {
      // É um produto de guarda do SIAC
      this.logger.log(
        `[BIPAR] Produto do SIAC encontrado, atualizando bipagem...`,
        {
          id: produtoGuarda.id,
          id_siac: produtoGuarda.id_siac,
          sq_guarda: produtoGuarda.sq_guarda,
          bipado_atual: produtoGuarda.bipado,
        },
      );

      // Se já estava bipado, não incrementar, apenas atualizar dados se necessário
      // A menos que seja um ajuste de quantidade explícito
      if (dados?.quantidade) {
        produtoGuarda.qtde_bipada = dados.quantidade;
      } else if (!produtoGuarda.bipado) {
        // Se não estava bipado, marca como 1 item bipado
        // Se quantity > 0, assume 1, senão mantém
        produtoGuarda.qtde_bipada = (produtoGuarda.qtde_bipada || 0) + 1;
      }
      // Se já estava bipado e não mandou quantidade, mantém como está (idempotência básica) ou incrementa?
      // Assumindo que bipar novamente não deve incrementar se já estiver ok, ou se for bipagem unitária.
      // Regra atual: Sempre marca como true.

      produtoGuarda.bipado = true;
      produtoGuarda.dt_bipagem = new Date();
      if (dados?.endereco) {
        produtoGuarda.endereco_confirmado = dados.endereco;
      }

      const resultado = await this.produtosGuardaRepository.save(produtoGuarda);
      this.logger.log(`[BIPAR] Produto SIAC salvo com sucesso`, {
        id: resultado.id,
        bipado: resultado.bipado,
        qtde_bipada: resultado.qtde_bipada,
      });

      const produtoAtualizado = await this.produtosGuardaRepository.findOne({
        where: { id: produtoId },
      });

      console.log('Produto atualizado após bipagem:', produtoAtualizado);

      return {
        success: true,
        data: {
          id: produtoGuarda.id,
          item: produtoGuarda.id_siac,
          cd_produto: produtoGuarda.cd_produto,
          no_produto: produtoGuarda.no_produto,
          quantidade: produtoGuarda.quantidade,
          qtde_bipada: produtoGuarda.qtde_bipada,
          bipado: produtoGuarda.bipado,
          endereco: produtoGuarda.endereco,
          endereco_confirmado: produtoGuarda.endereco_confirmado,
          dt_bipagem: produtoGuarda.dt_bipagem,
        },
        message: `Produto bipado (${produtoGuarda.qtde_bipada}/${produtoGuarda.quantidade})`,
      };
    }

    // Se não encontrou em ProdutosGuarda, buscar em ProdNfc (guarda local)
    this.logger.log(`[BIPAR] Buscando em ProdNfc (guarda local)...`);
    const produtoNfc = await this.prodNfcRepository.findOne({
      where: { id: produtoId },
    });

    if (!produtoNfc) {
      this.logger.error(
        `[BIPAR] Produto com ID ${produtoId} não encontrado em nenhuma tabela`,
      );
      throw new NotFoundException(`Produto com ID ${produtoId} não encontrado`);
    }

    this.logger.log(
      `[BIPAR] Produto local encontrado, atualizando bipagem...`,
      {
        id: produtoNfc.id,
        item: produtoNfc.item,
      },
    );

    produtoNfc.bipado = true;
    produtoNfc.dt_bipagem = new Date();
    if (dados?.quantidade) {
      produtoNfc.qtde_bipada = dados.quantidade;
    }
    if (dados?.endereco) {
      produtoNfc.endereco_confirmado = dados.endereco;
    }
    if (dados?.guardaId) {
      produtoNfc.guarda_id = dados.guardaId;
    }

    const resultadoNfc = await this.prodNfcRepository.save(produtoNfc);
    this.logger.log(`[BIPAR] Produto local salvo com sucesso`, {
      id: resultadoNfc.id,
      bipado: resultadoNfc.bipado,
      qtde_bipada: resultadoNfc.qtde_bipada,
    });

    return {
      success: true,
      data: {
        id: produtoNfc.id,
        item: produtoNfc.item,
        codpro: produtoNfc.codpro,
        bipado: produtoNfc.bipado,
        qtde_bipada: produtoNfc.qtde_bipada,
        endereco_confirmado: produtoNfc.endereco_confirmado,
        dt_bipagem: produtoNfc.dt_bipagem,
      },
      message: 'Produto marcado como bipado',
    };
  }

  /**
   * Busca produtos de uma guarda específica (SIAC ou local)
   */
  async buscarProdutosPorGuarda(guardaId: number) {
    this.log(`Buscando produtos da guarda ${guardaId}`);
    const guarda = await this.findGuardaById(guardaId);

    // Se for guarda do SIAC, buscar de ProdutosGuarda
    if (guarda.sq_guarda_siac) {
      const produtosGuarda = await this.produtosGuardaRepository.find({
        where: { sq_guarda: guarda.sq_guarda },
      });

      return {
        success: true,
        data: produtosGuarda.map((p) => ({
          id: p.id,
          item: p.id_siac,
          cd_produto: p.cd_produto,
          no_produto: p.no_produto,
          quantidade: p.quantidade,
          qtde_bipada: p.qtde_bipada,
          bipado: p.bipado,
          endereco: p.endereco,
          endereco_confirmado: p.endereco_confirmado,
          cod_barras: p.cod_barras,
          cd_fabrica: p.cd_fabrica,
          dt_bipagem: p.dt_bipagem,
        })),
        metadata: {
          guardaId: guarda.sq_guarda,
          tipo: 'SIAC',
          total: produtosGuarda.length,
        },
      };
    }

    // Guarda local - buscar de ProdNfc via Compra
    const compra = guarda.compra?.[0];
    if (!compra) {
      return {
        success: true,
        data: [],
        metadata: {
          guardaId: guarda.sq_guarda,
          tipo: 'LOCAL',
          total: 0,
        },
      };
    }

    const produtos = await this.prodNfcRepository.find({
      where: {
        cd_loja: compra.cd_loja,
        numnot: compra.numnot,
        serie: compra.serie,
      },
    });

    return {
      success: true,
      data: produtos.map((p) => ({
        id: p.id,
        item: p.item,
        cd_produto: p.codpro,
        no_produto: p.produto,
        quantidade: p.qtde,
        qtde_bipada: p.qtde_bipada,
        bipado: p.bipado,
        endereco: null,
        endereco_confirmado: p.endereco_confirmado,
        cod_barras: [],
        cd_fabrica: null,
        dt_bipagem: p.dt_bipagem,
      })),
      metadata: {
        guardaId: guarda.sq_guarda,
        tipo: 'LOCAL',
        total: produtos.length,
      },
    };
  }

  /**
   * Reseta o status de bipagem de um produto (SIAC ou local)
   */
  async resetarBipagem(produtoId: number) {
    this.log(`Resetando bipagem do produto ${produtoId}`);

    // Primeiro tentar buscar em ProdutosGuarda (guardas do SIAC)
    const produtoGuarda = await this.produtosGuardaRepository.findOne({
      where: { id: produtoId },
    });

    if (produtoGuarda) {
      produtoGuarda.qtde_bipada = 0;
      produtoGuarda.bipado = false;
      produtoGuarda.dt_bipagem = null as unknown as Date;
      produtoGuarda.endereco_confirmado = null as unknown as string;

      await this.produtosGuardaRepository.save(produtoGuarda);

      return {
        success: true,
        data: {
          id: produtoGuarda.id,
          item: produtoGuarda.id_siac,
          cd_produto: produtoGuarda.cd_produto,
          no_produto: produtoGuarda.no_produto,
          quantidade: produtoGuarda.quantidade,
          qtde_bipada: produtoGuarda.qtde_bipada,
          bipado: produtoGuarda.bipado,
        },
        message: 'Bipagem resetada com sucesso',
      };
    }

    // Se não encontrou em ProdutosGuarda, buscar em ProdNfc (guarda local)
    const produtoNfc = await this.prodNfcRepository.findOne({
      where: { id: produtoId },
    });

    if (!produtoNfc) {
      this.logError(`Produto com ID ${produtoId} não encontrado`);
      throw new NotFoundException(`Produto com ID ${produtoId} não encontrado`);
    }

    produtoNfc.qtde_bipada = 0;
    produtoNfc.bipado = false;
    produtoNfc.dt_bipagem = null as unknown as Date;
    produtoNfc.endereco_confirmado = null as unknown as string;
    produtoNfc.guarda_id = null as unknown as number;

    await this.prodNfcRepository.save(produtoNfc);

    return {
      success: true,
      data: {
        id: produtoNfc.id,
        item: produtoNfc.item,
        codpro: produtoNfc.codpro,
        bipado: produtoNfc.bipado,
        qtde_bipada: produtoNfc.qtde_bipada,
      },
      message: 'Bipagem resetada com sucesso',
    };
  }

  async desbiparTodos(sqGuarda: number) {
    this.log(`Desbipando todos os produtos da guarda ${sqGuarda}`);
    const guarda = await this.findGuardaById(sqGuarda);
    const compra = guarda.compra?.[0];

    if (!compra) {
      this.logError(`Compra não encontrada para guarda ${sqGuarda}`);
      throw new NotFoundException(
        `Compra não encontrada para guarda ${sqGuarda}`,
      );
    }

    await this.prodNfcRepository.update(
      { numnot: compra.numnot, serie: compra.serie, cd_loja: compra.cd_loja },
      { bipado: false },
    );

    return {
      success: true,
      message: `Todos os produtos da nota ${compra.numnot} foram desbipados`,
      data: {
        numnot: compra.numnot,
        serie: compra.serie,
      },
    };
  }

  async getContagemBipados(sqGuarda: number) {
    const guarda = await this.findGuardaById(sqGuarda);

    let totalBipados = 0;
    let totalNaoBipados = 0;
    let totalProdutos = 0;

    // Se a guarda for do SIAC, buscar de ProdutosGuarda
    if (guarda.sq_guarda_siac) {
      const result = await this.produtosGuardaRepository
        .createQueryBuilder('pg')
        .select('SUM(pg.quantidade)', 'total')
        .addSelect('SUM(pg.qtde_bipada)', 'bipados')
        .where('pg.sq_guarda = :sqGuarda', { sqGuarda: guarda.sq_guarda })
        .getRawOne();

      totalProdutos = Number(result.total) || 0;
      totalBipados = Number(result.bipados) || 0;
      totalNaoBipados = totalProdutos - totalBipados;
    } else {
      // Guarda local - buscar de ProdNfc via Compra
      const compras = guarda.compra || [];

      if (compras.length === 0) {
        return {
          success: true,
          data: {
            bipados: 0,
            naoBipados: 0,
            total: 0,
            percentualBipado: 0,
          },
          metadata: this.buildMetadata(guarda.cd_loja),
        };
      }

      for (const compra of compras) {
        const produtos = await this.prodNfcRepository.find({
          where: {
            cd_loja: compra.cd_loja,
            numnot: compra.numnot,
            serie: compra.serie,
          },
        });

        for (const produto of produtos) {
          totalProdutos++;
          if (produto.bipado) {
            totalBipados++;
          } else {
            totalNaoBipados++;
          }
        }
      }
    }

    const percentualBipado =
      totalProdutos > 0
        ? Math.round((totalBipados / totalProdutos) * 100 * 100) / 100
        : 0;

    return {
      success: true,
      data: {
        bipados: totalBipados,
        naoBipados: totalNaoBipados,
        total: totalProdutos,
        percentualBipado,
      },
      metadata: this.buildMetadata(guarda.cd_loja),
    };
  }

  // ==================== MÉTODOS DE BUSCA ====================

  private async findCompraById(compraId: number): Promise<Compra | null> {
    return this.compraRepository.findOne({
      where: { id: compraId },
      relations: ['guarda'],
    });
  }

  private async findEstoquistaById(
    estoquistaId: number,
  ): Promise<Estoquista | null> {
    return this.estoquistaRepository.findOne({
      where: { codoper: estoquistaId.toString() },
      relations: ['guarda_estoquista'],
    });
  }

  private async findGuardasByUser(cdUsuario?: string): Promise<Guarda[]> {
    const where: any = {};
    if (cdUsuario) {
      where.guarda_estoquista = { codoper: cdUsuario };
    }

    return this.guardaRepository.find({
      where,
      relations: ['compra', 'compra.produtos', 'guarda_estoquista'],
      order: { dt_emissao: 'DESC' },
    });
  }

  private async findGuardaById(sqGuarda: number): Promise<Guarda> {
    const guarda = await this.guardaRepository.findOne({
      where: { sq_guarda: sqGuarda },
      relations: ['compra', 'compra.produtos', 'guarda_estoquista'],
    });

    if (!guarda) {
      throw new NotFoundException(`Guarda com ID ${sqGuarda} não encontrada`);
    }

    return guarda;
  }

  private async findGuardaByIdSimple(sqGuarda: number): Promise<Guarda> {
    const guarda = await this.guardaRepository.findOne({
      where: { sq_guarda: sqGuarda },
    });

    if (!guarda) {
      throw new NotFoundException(`Guarda com ID ${sqGuarda} não encontrada`);
    }

    return guarda;
  }

  private async getNomeFornecedor(codFornecedor?: string): Promise<string> {
    if (!codFornecedor) return '';

    const fornecedor = await this.fornecedorRepository.findOne({
      where: { codfor: codFornecedor },
    });

    return fornecedor?.fornec || '';
  }

  private async getProdutoInfo(
    codpro: string,
  ): Promise<{ nome: string; cod_barra: string }> {
    const produto = await this.produtoRepository.findOne({
      where: { codpro },
    });

    return {
      nome: produto?.produto || '',
      cod_barra: produto?.cod_barra || '',
    };
  }

  private async getEnderecoByProduto(codpro: string): Promise<string> {
    const prdLoja = await this.prdLojaRepository.findOne({
      where: { codpro, cd_loja: this.CD_LOJA_PADRAO },
    });

    return prdLoja?.localiza || '';
  }

  private async getEnderecoId(endereco: string): Promise<string> {
    if (!endereco) {
      this.logger.log(
        '[ENDERECO_ID] Endereço vazio, retornando id_endereco vazio',
      );
      return '';
    }

    this.logger.log(
      `[ENDERECO_ID] Buscando id_endereco para endereco="${endereco}"`,
    );

    const enderecoRecord = await this.enderecoIdRepository.findOne({
      where: { endereco },
    });

    if (!enderecoRecord) {
      this.logger.log(
        `[ENDERECO_ID] Nenhum registro encontrado na tabela enderecos_id para endereco="${endereco}"`,
      );
      return '';
    }

    const id = enderecoRecord.id.toString();
    this.logger.log(
      `[ENDERECO_ID] Encontrado id_endereco=${id} para endereco="${endereco}"`,
    );

    return id;
  }

  // ==================== MÉTODOS DE FORMATAÇÃO ====================

  private async formatGuardasList(
    guardas: Guarda[],
  ): Promise<GuardaFormatada[]> {
    return Promise.all(
      guardas.map(async (guarda) => this.formatGuardaItem(guarda)),
    );
  }

  private async formatGuardaItem(guarda: Guarda): Promise<GuardaFormatada> {
    const compra = guarda.compra?.[0];
    const codFornecedor = compra?.codfor || guarda.cd_fornece;
    const nomeFornecedor = await this.getNomeFornecedor(codFornecedor);

    // Contar SKUs: se for guarda do SIAC, buscar de produtos_guarda
    let skuCount = 0;
    if (guarda.sq_guarda_siac) {
      const produtosGuarda = await this.produtosGuardaRepository.count({
        where: { sq_guarda: guarda.sq_guarda },
      });
      skuCount = produtosGuarda;
    } else {
      skuCount = compra?.produtos?.length || 0;
    }

    return {
      sq_guarda: guarda.sq_guarda.toString(),
      nu_nota: guarda.nu_nota || '',
      sg_serie: guarda.sg_serie || '',
      cd_fornece: guarda.cd_fornece || '',
      fornecedor: nomeFornecedor,
      dt_entrada: this.formatDate(guarda.dt_emissao),
      hr_entrada: guarda.hr_emissao || '',
      dt_iniguar: this.formatDate(guarda.dt_iniguar),
      hr_iniguar: guarda.hr_iniguar || '',
      dt_fimguar: this.formatDate(guarda.dt_fimguar),
      hr_fimguar: guarda.hr_fimguar || '',
      SKUs: skuCount,
      status: this.calcularStatus(guarda),
    };
  }

  private async formatProdutos(
    produtos: ProdNfc[],
  ): Promise<ProdutoFormatado[]> {
    return Promise.all(
      produtos.map(async (produto, index) =>
        this.formatProdutoItem(produto, index),
      ),
    );
  }

  private async formatProdutoItem(
    produto: ProdNfc,
    index: number,
  ): Promise<ProdutoFormatado> {
    const produtoInfo = await this.getProdutoInfo(produto.codpro);
    const endereco = await this.getEnderecoByProduto(produto.codpro);
    const idEndereco = await this.getEnderecoId(endereco);

    return {
      id: produto.id,
      cd_produto: produto.codpro || '',
      no_produto: produtoInfo.nome,
      quantidade: produto.qtde || 0,
      qtde_bipada: produto.qtde_bipada || 0,
      cod_barras: produtoInfo.cod_barra ? [produtoInfo.cod_barra] : [],
      endereco,
      cd_fabrica: produto.codpro || '',
      id_endereco: idEndereco || `END_${index + 1}`,
      item: produto.item || '',
      bipado: produto.bipado || false,
    };
  }

  /**
   * Formata produtos da ProdutosGuarda (guardas do SIAC)
   */
  private async formatProdutosGuarda(
    produtos: ProdutosGuarda[],
  ): Promise<ProdutoFormatado[]> {
    const result: ProdutoFormatado[] = [];

    for (let index = 0; index < produtos.length; index++) {
      const produto = produtos[index];
      const endereco = produto.endereco || '';
      const idEndereco = await this.getEnderecoId(endereco);

      this.logger.log(
        `[ENDERECO_ID] Produto SIAC id=${produto.id}, id_siac=${produto.id_siac}, endereco="${endereco}", id_endereco_resolvido="${idEndereco || ''}"`,
      );

      result.push({
        id: produto.id,
        cd_produto: produto.cd_produto || '',
        no_produto: produto.no_produto || '',
        quantidade: produto.quantidade || 0,
        qtde_bipada: produto.qtde_bipada || 0,
        cod_barras: produto.cod_barras || [],
        endereco,
        cd_fabrica: produto.cd_fabrica || '',
        id_endereco: idEndereco || `END_${index + 1}`,
        item: produto.id_siac || '',
        bipado: produto.bipado || false,
      });
    }

    return result;
  }

  // ==================== MÉTODOS DE CONSTRUÇÃO ====================

  private buildGuarda(
    createGuardaSeederDto: CreateGuardaSeederDto,
    estoquista: Estoquista,
  ): Guarda {
    return this.guardaRepository.create({
      cd_loja: '01',
      dt_emissao: new Date(),
      hr_emissao: this.getCurrentTime(),
      in_tipogua: 'C',
      cd_fornece: createGuardaSeederDto.cd_fornece,
      sg_serie: createGuardaSeederDto.sg_serie,
      nu_nota: createGuardaSeederDto.nu_nota,
      cd_usuario: '8243',
      in_app: 'S',
      guarda_estoquista: [estoquista],
    });
  }

  private async associateGuardaToEstoquista(
    guarda: Guarda,
    estoquista: Estoquista,
  ): Promise<void> {
    estoquista.guarda_estoquista = [guarda];

    await this.estoquistaRepository.save(estoquista);
  }

  // ==================== MÉTODOS DE RESPOSTA ====================

  private buildSuccessResponse(data: GuardaFormatada[], cdLoja?: string) {
    return {
      success: true,
      data: {
        data,
        total: data.length,
      },
      metadata: this.buildMetadata(cdLoja),
    };
  }

  private buildGuardaDetailResponse(
    guarda: Guarda,
    compra: Compra | undefined,
    fornecedor: string,
    produtos: ProdutoFormatado[],
  ) {
    return {
      success: true,
      data: {
        data: {
          sq_guarda: guarda.sq_guarda.toString(),
          nu_nota: guarda.nu_nota,
          fornecedor,
          cd_fornece: compra?.codfor || guarda.cd_fornece || '',
          dt_emissao: this.formatDate(guarda.dt_emissao),
          hr_emissao: guarda.hr_emissao || '',
          dt_entrada: this.formatDate(guarda.dt_emissao),
          dt_iniguar: this.formatDate(guarda.dt_iniguar),
          hr_iniguar: guarda.hr_iniguar || '',
          dt_fimguar: this.formatDate(guarda.dt_fimguar),
          hr_fimguar: guarda.hr_fimguar || '',
          status: this.calcularStatus(guarda),
          produtos,
          estoquistas: this.formatEstoquistas(guarda.guarda_estoquista),
        },
      },
      metadata: this.buildMetadata(guarda.cd_loja),
    };
  }

  private buildIniciarResponse(guarda: Guarda) {
    return {
      success: true,
      data: {
        data: {
          sq_guarda: guarda.sq_guarda.toString(),
          dt_iniguar: this.formatDate(guarda.dt_iniguar),
          hr_iniguar: guarda.hr_iniguar,
          status: this.calcularStatus(guarda),
        },
      },
      metadata: this.buildMetadata(guarda.cd_loja),
    };
  }

  private buildFinalizarResponse(guarda: Guarda) {
    return {
      success: true,
      data: {
        data: {
          sq_guarda: guarda.sq_guarda.toString(),
          dt_fimguar: this.formatDate(guarda.dt_fimguar),
          hr_fimguar: guarda.hr_fimguar,
          in_fimapp: guarda.in_fimapp,
          status: this.calcularStatus(guarda),
        },
      },
      metadata: this.buildMetadata(guarda.cd_loja),
    };
  }

  private buildMetadata(cdLoja?: string) {
    return {
      timestamp: new Date().toISOString(),
      loja: cdLoja || this.CD_LOJA_PADRAO,
      regiao: '01',
    };
  }

  private formatEstoquistas(estoquistas: Estoquista[] = []) {
    return estoquistas.map((est) => ({
      codoper: est.codoper,
      nome: est.nome,
    }));
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private calcularStatus(guarda: Guarda): string {
    if (guarda.in_fimapp === 'S' && guarda.dt_fimguar) {
      return 'Finalizado';
    }
    if (guarda.dt_iniguar && guarda.hr_iniguar) {
      return 'Iniciado';
    }
    return 'Pendente';
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  private getCurrentTime(): string {
    return new Date().toISOString().slice(11, 19);
  }
}
