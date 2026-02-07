import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Guarda } from './entities/guarda.entity';
import { GuardaBackup } from './entities/guarda-backup.entity';
import { ProdutosGuarda } from '../produtos_guarda/entities/produtos_guarda.entity';
import { Compra } from '../compra/entities/compra.entity';
import { Estoquista } from '../estoquista/entities/estoquista.entity';
import { GuardaProdService } from '../guarda_prod/guarda/guarda_prod.service';
import { CompraService } from '../compra/compra.service';
import {
  GuardaProd,
  Produto,
} from '../guarda_prod/guarda/interfaces/guarda_prod.interface';
import { EstoquistaService } from 'src/estoquista/estoquista.service';

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
  duration: string;
}

/**
 * Service para sincronização de Guardas do SIAC → Sistema Interno
 */
@Injectable()
export class GuardaSyncService {
  private readonly logger = new Logger(GuardaSyncService.name);

  constructor(
    @InjectRepository(Guarda)
    private guardaRepository: Repository<Guarda>,
    @InjectRepository(GuardaBackup)
    private guardaBackupRepository: Repository<GuardaBackup>,
    @InjectRepository(ProdutosGuarda)
    private produtosGuardaRepository: Repository<ProdutosGuarda>,
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @InjectRepository(Estoquista)
    private estoquistaRepository: Repository<Estoquista>,
    private guardaProdService: GuardaProdService,
    private compraService: CompraService,
    private estoquistaService: EstoquistaService,
  ) {
    this.logger.log('GuardaSyncService inicializado');
  }

  /**
   * Cron Job - Sincroniza guardas do SIAC a cada 60 segundos
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleSiacSync() {
    if (process.env.SIAC_SYNC_ENABLED === 'true') {
      this.logger.log('Iniciando sincronização automática com SIAC...');
      try {
        const result = await this.syncFromSiac();
        this.logger.log(
          `Sincronização concluída: ${result.synced} sincronizadas, ${result.skipped} ignoradas, ${result.errors} erros em ${result.duration}`,
        );
      } catch (error) {
        this.logger.error(`Erro na sincronização automática: ${error.message}`);
      }
    }
  }

  /**
   * Sincroniza guardas do SIAC para o sistema interno
   */
  async syncFromSiac(): Promise<SyncResult> {
    const startTime = Date.now();
    let synced = 0,
      skipped = 0,
      errors = 0;

    try {
      // 1. Sincronizar Compras primeiro (se disponível)
      // try {
      //   await this.compraService.syncFromPostgres();
      //   await this.estoquistaService.syncFromPostgres();
      //   this.logger.log('Compras sincronizadas do PostgreSQL');
      // } catch (error) {
      //   this.logger.warn(
      //     `Não foi possível sincronizar compras: ${error.message}`,
      //   );
      // }

      // 2. Buscar guardas do SIAC
      const guardasSiac = await this.guardaProdService.listarGuardas();

      if (!guardasSiac || !Array.isArray(guardasSiac)) {
        this.logger.warn('Nenhuma guarda retornada do SIAC');
        return {
          synced: 0,
          skipped: 0,
          errors: 0,
          duration: `${Date.now() - startTime}ms`,
        };
      }

      this.logger.log(`Encontradas ${guardasSiac.length} guardas no SIAC`);

      // 3. Remover guardas locais que não existem mais no SIAC (com backup)
      try {
        const siacIds = new Set(guardasSiac.map((g) => g.sq_guarda));

        const guardasLocais = await this.guardaRepository.find({
          where: { sq_guarda_siac: Not(IsNull()) },
        });

        let removedCount = 0;

        for (const guarda of guardasLocais) {
          if (!guarda.sq_guarda_siac) {
            continue;
          }

          if (!siacIds.has(guarda.sq_guarda_siac)) {
            try {
              await this.backupAndDeleteGuarda(guarda);
              removedCount++;
            } catch (error) {
              this.logger.error(
                `Erro ao remover guarda ${guarda.sq_guarda} (SIAC ${guarda.sq_guarda_siac}): ${error.message}`,
              );
              errors++;
            }
          }
        }

        if (removedCount > 0) {
          this.logger.log(
            `Removidas ${removedCount} guardas que não existem mais no SIAC (com backup)`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Erro ao verificar guardas removidas do SIAC: ${error.message}`,
        );
        errors++;
      }

      // 4. Para cada guarda do SIAC, verificar e criar se não existir
      for (const guardaSiac of guardasSiac) {
        try {
          // Verificar se já existe pelo sq_guarda_siac
          const existe = await this.guardaRepository.findOne({
            where: { sq_guarda_siac: guardaSiac.sq_guarda },
          });

          if (existe) {
            skipped++;
            continue;
          }

          // Criar guarda interna
          await this.criarGuardaInterna(guardaSiac);
          synced++;
          this.logger.log(
            `Guarda ${guardaSiac.sq_guarda} sincronizada com sucesso`,
          );
        } catch (error) {
          this.logger.error(
            `Erro ao sincronizar guarda ${guardaSiac.sq_guarda}: ${error.message}`,
          );
          errors++;
        }
      }

      return {
        synced,
        skipped,
        errors,
        duration: `${Date.now() - startTime}ms`,
      };
    } catch (error) {
      this.logger.error(`Erro na sincronização: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria uma guarda interna a partir dos dados do SIAC
   */
  private async criarGuardaInterna(guardaSiac: GuardaProd): Promise<Guarda> {
    // 1. Buscar Compra existente (já sincronizada)
    const compra = await this.compraRepository.findOne({
      where: {
        numnot: guardaSiac.nu_nota,
        codfor: guardaSiac.cd_fornece,
        cd_loja: guardaSiac.cd_loja,
      },
    });

    // 2. Buscar Estoquista pelo cd_estoqui
    let estoquista: Estoquista | null = null;
    if (guardaSiac.cd_estoqui) {
      estoquista = await this.estoquistaRepository.findOne({
        where: { codoper: guardaSiac.cd_estoqui },
      });
    }

    // 3. Criar Guarda
    const guarda = this.guardaRepository.create({
      sq_guarda_siac: guardaSiac.sq_guarda,
      cd_loja: guardaSiac.cd_loja,
      dt_emissao: this.parseDate(guardaSiac.dt_emissao) ?? undefined,
      hr_emissao: guardaSiac.hr_emissao,
      cd_fornece: guardaSiac.cd_fornece,
      nu_nota: guardaSiac.nu_nota,
      sg_serie: guardaSiac.sg_serie,
      in_tipogua: 'C',
      in_app: 'S',
      guarda_estoquista: estoquista ? [estoquista] : [],
    });

    // 4. Se tiver compra, associar série
    if (compra) {
      guarda.sg_serie = compra.serie;
    }

    await this.guardaRepository.save(guarda);

    // 5. Buscar detalhes e criar ProdutosGuarda
    await this.syncProdutosGuarda(guarda, guardaSiac.sq_guarda);

    return guarda;
  }

  /**
   * Sincroniza os produtos de uma guarda do SIAC
   * Agrupa produtos duplicados (mesmo cd_produto) somando as quantidades
   */
  private async syncProdutosGuarda(
    guarda: Guarda,
    sqGuardaSiac: string,
  ): Promise<void> {
    try {
      // Buscar detalhes do SIAC
      const detalhes = await this.guardaProdService.obterDetalhes(sqGuardaSiac);

      const produtos = detalhes?.produtos;

      if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
        this.logger.warn(
          `Nenhum produto encontrado para guarda ${sqGuardaSiac}`,
        );
        return;
      }

      // 1. Agrupar produtos por cd_produto (mesmo produto físico, itens diferentes na NF)
      const produtosAgrupados = new Map<
        string,
        {
          id_siac: string; // Mantém o primeiro id_siac
          cd_produto: string;
          no_produto: string;
          cd_fabrica: string;
          cod_barras: string[];
          endereco: string; // Mantém o primeiro endereco
          quantidade: number; // Soma das quantidades
          ids_siac: string[]; // Lista de todos os ids_siac agrupados (para log)
        }
      >();

      for (const produto of produtos) {
        const chave = produto.cd_produto;

        if (produtosAgrupados.has(chave)) {
          // Produto já existe no agrupamento: incrementar quantidade
          const existente = produtosAgrupados.get(chave)!;
          existente.quantidade += produto.quantidade;
          existente.ids_siac.push(produto.id);
          this.logger.log(
            `[AGRUPAR] Produto ${chave} duplicado encontrado. Quantidade total: ${existente.quantidade} (ids_siac: ${existente.ids_siac.join(', ')})`,
          );
        } else {
          // Primeira ocorrência do produto
          produtosAgrupados.set(chave, {
            id_siac: produto.id,
            cd_produto: produto.cd_produto,
            no_produto: produto.no_produto,
            cd_fabrica: produto.cd_fabrica,
            cod_barras: produto.cod_barras,
            endereco: produto.endereco,
            quantidade: produto.quantidade,
            ids_siac: [produto.id],
          });
        }
      }

      this.logger.log(
        `[AGRUPAR] ${produtos.length} produtos do SIAC agrupados em ${produtosAgrupados.size} produtos únicos`,
      );

      // 2. Salvar produtos agrupados
      let salvos = 0;
      let atualizados = 0;
      let erros = 0;

      for (const produtoAgrupado of produtosAgrupados.values()) {
        try {
          // Verificar se produto já existe na tabela (por cd_produto e sq_guarda)
          const produtoExistente = await this.produtosGuardaRepository.findOne({
            where: {
              cd_produto: produtoAgrupado.cd_produto,
              sq_guarda: guarda.sq_guarda,
            },
          });

          if (produtoExistente) {
            // Produto já existe: incrementar quantidade, preservar qtde_bipada
            const quantidadeAnterior = produtoExistente.quantidade;
            produtoExistente.quantidade += produtoAgrupado.quantidade;
            // Preservar qtde_bipada e bipado se já foram definidos
            // (não sobrescrever se já foi bipado)
            await this.produtosGuardaRepository.save(produtoExistente);
            atualizados++;
            this.logger.log(
              `[ATUALIZAR] Produto ${produtoAgrupado.cd_produto} atualizado: ${quantidadeAnterior} + ${produtoAgrupado.quantidade} = ${produtoExistente.quantidade}`,
            );
          } else {
            // Produto não existe: criar novo
            const produtoGuarda = this.produtosGuardaRepository.create({
              id_siac: produtoAgrupado.id_siac,
              cd_produto: produtoAgrupado.cd_produto,
              no_produto: produtoAgrupado.no_produto,
              cd_fabrica: produtoAgrupado.cd_fabrica,
              cod_barras: produtoAgrupado.cod_barras,
              endereco: produtoAgrupado.endereco,
              quantidade: produtoAgrupado.quantidade,
              sq_guarda: guarda.sq_guarda,
              bipado: false,
              qtde_bipada: 0,
            });

            await this.produtosGuardaRepository.save(produtoGuarda);
            salvos++;
            this.logger.log(
              `[CRIAR] Produto ${produtoAgrupado.cd_produto} criado com quantidade ${produtoAgrupado.quantidade} (ids_siac agrupados: ${produtoAgrupado.ids_siac.join(', ')})`,
            );
          }
        } catch (error) {
          erros++;
          this.logger.error(
            `Erro ao salvar produto ${produtoAgrupado.cd_produto} da guarda ${sqGuardaSiac}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Sincronizados ${produtosAgrupados.size} produtos únicos para guarda ${sqGuardaSiac} (${salvos} criados, ${atualizados} atualizados, ${erros} erros)`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar detalhes da guarda ${sqGuardaSiac}: ${error.message}`,
      );
    }
  }

  /**
   * Faz backup completo de uma guarda e seus produtos antes de remover do banco
   */
  private async backupAndDeleteGuarda(guarda: Guarda): Promise<void> {
    // Buscar produtos vinculados à guarda
    const produtos = await this.produtosGuardaRepository.find({
      where: { sq_guarda: guarda.sq_guarda },
    });

    // Criar registro de backup "rico" com snapshots completos
    const backup = this.guardaBackupRepository.create({
      sq_guarda_original: guarda.sq_guarda,
      sq_guarda_siac: guarda.sq_guarda_siac ?? null,
      cd_loja: guarda.cd_loja,
      nu_nota: guarda.nu_nota ?? null,
      cd_fornece: guarda.cd_fornece ?? null,
      sg_serie: guarda.sg_serie ?? null,
      dt_emissao: guarda.dt_emissao ?? null,
      dt_iniguar: guarda.dt_iniguar ?? null,
      dt_fimguar: guarda.dt_fimguar ?? null,
      cd_usuario: guarda.cd_usuario ?? null,
      in_app: guarda.in_app ?? null,
      in_fimapp: guarda.in_fimapp ?? null,
      guarda_snapshot: guarda,
      produtos_snapshot: produtos,
      deleted_at: new Date(),
      deleted_reason: 'NOT_FOUND_IN_SIAC',
      deleted_source: 'SIAC_SYNC',
    });

    await this.guardaBackupRepository.save(backup);

    // Remover produtos vinculados
    if (produtos.length > 0) {
      await this.produtosGuardaRepository.delete({
        sq_guarda: guarda.sq_guarda,
      });
    }

    // Remover a guarda principal
    await this.guardaRepository.remove(guarda);

    this.logger.log(
      `Guarda ${guarda.sq_guarda} (SIAC ${guarda.sq_guarda_siac}) movida para backup e removida do banco`,
    );
  }

  /**
   * Converte string de data do SIAC para Date
   * Suporta formatos: DD/MM/YYYY, YYYYMMDD
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === '') {
      return null;
    }

    const cleaned = dateStr.trim();

    // Formato DD/MM/YYYY (10 caracteres com barras)
    if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1970) {
          return new Date(year, month, day);
        }
      }
      return null;
    }

    // Formato YYYYMMDD (8 caracteres)
    if (cleaned.length === 8 && !isNaN(Number(cleaned))) {
      const year = parseInt(cleaned.substring(0, 4), 10);
      const month = parseInt(cleaned.substring(4, 6), 10) - 1;
      const day = parseInt(cleaned.substring(6, 8), 10);

      if (year > 1970) {
        return new Date(year, month, day);
      }
    }

    return null;
  }
}
