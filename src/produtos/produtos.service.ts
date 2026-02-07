import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Produto } from './entities/produto.entity';
import { PrdLoja } from 'src/prd_loja/entities/prd_loja.entity';
import { EnderecoId } from 'src/guarda/entities/endereco-id.entity';
import { ProdutosGuarda } from 'src/produtos_guarda/entities/produtos_guarda.entity';
import { SiacConfig } from 'src/guarda_prod/config/siac.config';
import { GuardaProdService } from 'src/guarda_prod/guarda/guarda_prod.service';
import { CallSiacService } from 'src/utils/call_siac.service';
import { BipagemParcialEnderecoService } from 'src/bipagem-parcial-endereco/bipagem-parcial-endereco.service';
import { Guarda } from 'src/guarda/entities/guarda.entity';

interface ProdutoResponse {
  cd_produto: string;
  no_produto: string;
  cd_fabrica: string;
  endereco: string;
  qt_estoque: number;
  situacao: string;
  cod_barras: string[];
}

interface SiacApiResponse<T> {
  status: string;
  data: T;
}

export interface AlterarEnderecoResponse {
  status: string;
  mensagem: string;
  endereco_anterior: string;
  endereco_novo: string;
}

interface EnderecoResponse {
  cd_loja: string;
  endereco: string;
  bloqueado: string;
  in_tipoend: string;
  ds_tipoend: string;
}

@Injectable()
export class ProdutosService {
  private readonly logger = new Logger(ProdutosService.name);

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private readonly CD_LOJA_PADRAO = '01';

  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    @InjectRepository(PrdLoja)
    private prdLojaRepository: Repository<PrdLoja>,
    @InjectRepository(EnderecoId)
    private enderecoIdRepository: Repository<EnderecoId>,
    @InjectRepository(ProdutosGuarda)
    private produtosGuardaRepository: Repository<ProdutosGuarda>,
    @InjectRepository(Guarda)
    private guardaRepository: Repository<Guarda>,
    private callSiacService: CallSiacService,
    private bipagemParcialService: BipagemParcialEnderecoService,
    @Optional()
    @InjectDataSource('postgresConnection')
    private postgresDataSource: DataSource,
    @InjectDataSource()
    private readonly mysqlDataSource: DataSource,
  ) {}

  async syncFromPostgres(): Promise<{ synced: number; errors: number }> {
    if (!this.postgresDataSource) {
      console.warn('Postgres connection not available. Skipping sync.');
      return { synced: 0, errors: 0 };
    }

    console.log('Sincronizando produtos...');
    const produtosPostgres = await this.postgresDataSource.query(`
      SELECT codpro, produto, aplicacao, unidade, codfor, codgru, codsubgru,
             codsec, num_fab, num_orig, cadastro, cod_barra
      FROM "D-1".produto
      WHERE codpro IS NOT NULL
    `);

    let synced = 0;
    let errors = 0;

    for (const produto of produtosPostgres) {
      try {
        if (!produto.codpro) {
          console.warn('Registro ignorado - codpro nulo:', produto);
          errors++;
          continue;
        }

        await this.produtoRepository.upsert(produto, ['codpro']);
        synced++;
      } catch (error) {
        console.error(
          'Erro ao sincronizar produto:',
          produto.codpro,
          error.message,
        );
        errors++;
      }
    }

    return { synced, errors };
  }

  async findAll(): Promise<Produto[]> {
    return this.produtoRepository.find();
  }

  async findOne(codpro: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { codpro },
    });
    if (!produto) {
      throw new NotFoundException('Produto nao encontrado');
    }
    return produto;
  }

  async makeSiacProdutoRequest(cod_barra: string): Promise<ProdutoResponse> {
    const reqId = this.generateRequestId();

    try {
      this.logger.log(`[${reqId}] Buscando produto: ${cod_barra} no SIAC`);

      const url = SiacConfig.getProdutoUrl();
      const payload = { cd_barras: cod_barra };

      // Passando o tipo ProdutoResponse para o callApi
      const response = await this.callSiacService.callApi<
        SiacApiResponse<ProdutoResponse>
      >(url, payload, reqId);

      this.logger.log(`[${reqId}] Produto ${cod_barra} encontrado no SIAC`);

      if (response.status !== 'OK') {
        this.logger.warn(
          `SIAC respondeu com status diferente de OK: ${response.status}`,
        );
      }

      this.logger.log(`[${reqId}] Produto: `, response.data);

      return response.data;
    } catch (error) {
      this.logger.error(
        `[${reqId}] Erro ao buscar produto no SIAC: ${error.message}`,
      );
      // Relançar para quem chamou tratar, ou lançar except específica se quiser
      throw error;
    }
  }

  async findByCodBarra(cod_barra: string): Promise<ProdutoResponse> {
    this.logger.log(`Consultando produto: ${cod_barra}`);

    // 1. Busca local para garantir que existe (opcional, dependendo da regra de negócio)
    const produto = await this.produtoRepository.findOne({
      where: { cod_barra },
    });

    if (!produto) {
      this.logger.warn(`Produto ${cod_barra} nao encontrado localmente`);
      throw new NotFoundException('Produto nao encontrado');
    }

    // 2. Busca detalhes no SIAC
    try {
      const produtoResponse = await this.makeSiacProdutoRequest(cod_barra);
      return produtoResponse;
    } catch (error) {
      this.logger.error(
        `Falha ao obter dados do SIAC para o produto ${cod_barra}`,
      );
      // Aqui você pode decidir:
      // - Retornar erro 404/500
      // - OU retornar os dados locais parciais se o SIAC falhar
      throw new NotFoundException(
        'Erro ao buscar detalhes do produto no sistema externo',
      );
    }
  }

  async findEnderecoById(id: number, codpro: string) {
    console.log('Consultando endereco: ', id, 'Produto - ', codpro);

    const prdLoja = await this.prdLojaRepository.findOne({
      where: { codpro },
    });
    if (!prdLoja) {
      throw new NotFoundException('PrdLoja nao encontrado');
    }

    const endereco = await this.enderecoIdRepository.findOne({
      where: { id },
    });
    if (!endereco) {
      throw new NotFoundException('Endereco nao encontrado');
    }

    console.log('Endereco encontrado tabela ids: ', endereco);
    console.log('Endereco encontrado: ', prdLoja);
    return {
      status:
        prdLoja.localiza?.replace(/\./g, '') ===
        endereco.endereco?.replace(/\./g, ''),
      endereco: endereco.endereco,
    };
  }

  async consultarEnderecoSiac(
    endereco: string,
    reqId: string,
  ): Promise<EnderecoResponse> {
    try {
      this.logger.log(
        `[${reqId}] Verificando existência do endereço: ${endereco}`,
      );

      const url = SiacConfig.getEnderecoConsultaUrl();
      // Assumindo payload padrão para consulta
      const payload = {
        cd_loja: SiacConfig.LOJA.codigo,
        endereco: endereco,
      };
      const response = await this.callSiacService.callApi<EnderecoResponse>(
        url,
        payload,
        reqId,
      );
      return response;
    } catch (error) {
      this.logger.warn(
        `[${reqId}] Falha ao validar endereço no SIAC: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async alterarEndereco(codpro: string, endereco: string) {
    const reqId = this.generateRequestId();
    this.logger.log(
      `[${reqId}] Alterando endereço produto ${codpro} para ${endereco}`,
    );

    const enderecoValido = await this.consultarEnderecoSiac(endereco, reqId);
    if (!enderecoValido || enderecoValido.endereco != endereco) {
      this.logger.warn(
        `[${reqId}] Endereço ${endereco} não encontrado no SIAC`,
      );
      throw new BadRequestException('Endereço não encontrado no SIAC');
    }

    try {
      const url = SiacConfig.getAlterarEnderecoUrl();
      const payload = {
        cd_loja: SiacConfig.LOJA.codigo,
        codpro: codpro,
        endereco: endereco,
      };

      const response =
        await this.callSiacService.callApi<AlterarEnderecoResponse>(
          url,
          payload,
          reqId,
        );

      this.logger.log(
        `[${reqId}] Endereço alterado com sucesso: ${response.mensagem}, status: ${response.status}`,
      );

      if (response.status === 'OK') {
        try {
          await this.prdLojaRepository.update(
            { cd_loja: SiacConfig.LOJA.codigo, codpro: codpro },
            { localiza: response.endereco_novo || endereco },
          );
          this.logger.log(
            `[${reqId}] PrdLoja localiza atualizado localmente para ${
              response.endereco_novo || endereco
            }`,
          );
        } catch (dbError) {
          this.logger.error(
            `[${reqId}] Erro ao atualizar PrdLoja localmente: ${dbError.message}`,
          );
        }
      }

      return response;
    } catch (error) {
      this.logger.error(
        `[${reqId}] Erro ao alterar endereço: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Formata endereço sem pontos para formato com pontos
   * Ex: "B49060102" -> "B.49.06.01.02"
   * @param enderecoSemPontos Endereço sem pontos (ex: "B49060102")
   * @returns Endereço formatado com pontos (ex: "B.49.06.01.02")
   */
  private formatarEnderecoComPontos(enderecoSemPontos: string): string {
    if (!enderecoSemPontos || enderecoSemPontos.length < 2) {
      return enderecoSemPontos;
    }

    // Primeiro caractere (letra)
    const primeiraLetra = enderecoSemPontos[0];
    // Resto da string (números)
    const numeros = enderecoSemPontos.slice(1);

    // Agrupar números em pares e adicionar pontos
    const numerosFormatados = numeros.match(/.{1,2}/g)?.join('.') || numeros;

    return `${primeiraLetra}.${numerosFormatados}`;
  }

  /**
   * Valida se o endereço informado corresponde ao endereço correto do produto
   * @param cdProduto Código do produto
   * @param enderecoInformado Endereço informado pelo usuário (ID ou Extenso)
   * @returns true se endereço corresponde, false caso contrário
   */
  private async validarEndereco(
    cdProduto: string,
    enderecoInformado: string,
  ): Promise<boolean> {
    this.logger.log(
      `[VALIDAR_ENDERECO] Validando endereço para produto ${cdProduto}`,
      { enderecoInformado },
    );

    // 1. Buscar endereço correto na prd_loja
    const prdLoja = await this.prdLojaRepository.findOne({
      where: { codpro: cdProduto, cd_loja: this.CD_LOJA_PADRAO },
    });

    if (!prdLoja || !prdLoja.localiza) {
      this.logger.warn(
        `[VALIDAR_ENDERECO] Endereço do produto ${cdProduto} não encontrado na prd_loja`,
      );
      throw new NotFoundException('Endereço do produto não encontrado');
    }

    // Formatar endereço adicionando pontos (localiza vem sem pontos: "B49060102" -> "B.49.06.01.02")
    const enderecoCorreto = this.formatarEnderecoComPontos(prdLoja.localiza);
    this.logger.log(
      `[VALIDAR_ENDERECO] Endereço correto (formatado): ${enderecoCorreto} (original: ${prdLoja.localiza})`,
    );

    // 2. Verificar se endereço informado é ID (numérico até 5 dígitos) ou Extenso
    const isId = /^\d{1,5}$/.test(enderecoInformado);

    if (isId) {
      // É ID: buscar na tabela enderecos_id via MySQL DataSource
      const enderecoId = parseInt(enderecoInformado, 10);
      this.logger.log(
        `[VALIDAR_ENDERECO] Endereço é ID, buscando na tabela enderecos_id: ${enderecoId}`,
      );

      const resultado = await this.mysqlDataSource.query(
        'SELECT endereco FROM enderecos_id WHERE id = ?',
        [enderecoId],
      );

      if (!resultado || resultado.length === 0) {
        this.logger.warn(
          `[VALIDAR_ENDERECO] Endereço com ID ${enderecoId} não encontrado`,
        );
        throw new NotFoundException(
          `Endereço com ID ${enderecoId} não encontrado`,
        );
      }

      const enderecoEncontrado = resultado[0].endereco; // Ex: "A.01.01.00.01"
      this.logger.log(
        `[VALIDAR_ENDERECO] Endereço encontrado na tabela: ${enderecoEncontrado}`,
      );

      // Comparar endereços
      const enderecosCorrespondem = enderecoCorreto === enderecoEncontrado;
      this.logger.log(
        `[VALIDAR_ENDERECO] Endereços correspondem: ${enderecosCorrespondem}`,
      );

      return enderecosCorrespondem;
    } else {
      // É Extenso: comparar diretamente
      this.logger.log(
        `[VALIDAR_ENDERECO] Endereço é Extenso, comparando diretamente`,
      );
      const enderecosCorrespondem = enderecoCorreto === enderecoInformado;
      this.logger.log(
        `[VALIDAR_ENDERECO] Endereços correspondem: ${enderecosCorrespondem}`,
      );

      return enderecosCorrespondem;
    }
  }

  // Bipar um produto
  async bipar(
    cd_produto: string,
    sq_guarda: number,
    qtde_bipada: number,
    endereco: string,
  ): Promise<ProdutosGuarda> {
    try {
      const guarda = await this.guardaRepository.findOne({
        where: { sq_guarda: sq_guarda },
      });
      if (!guarda) {
        throw new NotFoundException('Guarda nao encontrada');
      }

      this.logger.log(
        `[BIPAR] Bipando produto ${cd_produto} na guarda ${sq_guarda} com quantidade ${qtde_bipada} e endereco ${endereco}`,
      );
      const produto = await this.produtosGuardaRepository.findOne({
        where: { cd_produto: cd_produto, sq_guarda: guarda.sq_guarda },
      });

      if (!produto) {
        throw new NotFoundException('Produto nao encontrado');
      }

      if (produto.sq_guarda !== guarda.sq_guarda) {
        throw new BadRequestException('Produto nao encontrado na guarda');
      }

      if (produto.bipado) {
        throw new BadRequestException('Produto ja bipado');
      }

      const totalBipada =
        await this.bipagemParcialService.calcularTotalBipadaPorProdutoGuarda(
          produto.id,
        );

      if (
        qtde_bipada + totalBipada > produto.quantidade ||
        qtde_bipada > produto.quantidade ||
        qtde_bipada <= 0 ||
        !qtde_bipada
      ) {
        throw new BadRequestException('Verifique a quantidade bipada');
      }

      const enderecoValido = await this.validarEndereco(cd_produto, endereco);

      if (!enderecoValido) {
        throw new BadRequestException('Endereco inválido');
      }

      if (
        qtde_bipada + totalBipada == produto.quantidade ||
        qtde_bipada == produto.quantidade
      ) {
        produto.bipado = true;
        produto.endereco_confirmado = endereco;
        produto.qtde_bipada += qtde_bipada;
        produto.dt_bipagem = new Date();
        return await this.produtosGuardaRepository.save(produto);
      }

      await this.bipagemParcialService.criarConfirmacao({
        produto_guarda_id: produto.id,
        endereco: endereco,
        qtde_bipada: qtde_bipada,
      });
      produto.qtde_bipada += qtde_bipada;
      produto.dt_bipagem = new Date();
      return await this.produtosGuardaRepository.save(produto);
    } catch (error) {
      this.logger.error(
        `[BIPAR] Erro ao bipar produto ${cd_produto} na guarda ${sq_guarda} com quantidade ${qtde_bipada} e endereco ${endereco}: ${error.message}`,
      );
      throw error;
    }
  }
}
