import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntregaRota } from './entities/entrega-rota.entity';
import { EntregaCarga } from './entities/entrega-carga.entity';
import { EntregaCargaVolume } from './entities/entrega-carga-volume.entity';
import { EntregaCliente } from './entities/entrega-cliente.entity';
import { EntregaOrdem } from './entities/entrega-ordem.entity';
import { EntregaVolume } from './entities/entrega-volume.entity';
import { SyncUpDto } from './dto/sync-up.dto';

/**
 * EntregaService — Lógica de negócio do módulo Entrega (Zé da Entrega)
 *
 * Dois momentos de sync:
 *  1. SYNC DOWN (no galpão, antes de sair): monta payload completo com rota, carga, clientes, ordens, volumes
 *  2. SYNC UP (no galpão, ao retornar): recebe resultados e atualiza tudo no banco
 */
@Injectable()
export class EntregaService {
  private readonly logger = new Logger(EntregaService.name);

  constructor(
    @InjectRepository(EntregaRota)
    private readonly rotaRepo: Repository<EntregaRota>,
    @InjectRepository(EntregaCarga)
    private readonly cargaRepo: Repository<EntregaCarga>,
    @InjectRepository(EntregaCargaVolume)
    private readonly cargaVolumeRepo: Repository<EntregaCargaVolume>,
    @InjectRepository(EntregaCliente)
    private readonly clienteRepo: Repository<EntregaCliente>,
    @InjectRepository(EntregaOrdem)
    private readonly ordemRepo: Repository<EntregaOrdem>,
    @InjectRepository(EntregaVolume)
    private readonly volumeRepo: Repository<EntregaVolume>,
  ) {}

  // ================================================================
  // SYNC DOWN
  // ================================================================

  /**
   * Monta SyncDownPayload completo para um motorista.
   * Busca rota pendente → carga com volumes → clientes → ordens → volumes
   */
  async syncDown(motoristaId: string) {
    this.logger.log(`[SYNC-DOWN] Buscando rota para motorista ${motoristaId}`);

    // 1. Buscar rota pendente do motorista
    const rota = await this.rotaRepo.findOne({
      where: { motorista_id: motoristaId, status: 'pendente' },
    });

    if (!rota) {
      throw new NotFoundException(`Nenhuma rota pendente encontrada para motorista ${motoristaId}`);
    }

    // 2. Buscar carga da rota
    const carga = await this.cargaRepo.findOne({
      where: { rota_id: rota.id },
    });

    if (!carga) {
      throw new NotFoundException(`Nenhuma carga encontrada para rota ${rota.id}`);
    }

    // 3. Buscar volumes da carga
    const cargaVolumes = await this.cargaVolumeRepo.find({
      where: { carga_id: carga.id },
    });

    // 4. Buscar clientes da rota com ordens e volumes
    const clientes = await this.clienteRepo.find({
      where: { rota_id: rota.id },
      order: { ordem_na_rota: 'ASC' },
    });

    const clientesPayload = await Promise.all(
      clientes.map(async (cliente) => {
        const ordens = await this.ordemRepo.find({
          where: { cliente_id: cliente.id },
        });

        const ordensPayload = await Promise.all(
          ordens.map(async (ordem) => {
            const volumes = await this.volumeRepo.find({
              where: { ordem_id: ordem.id },
            });

            return {
              id: ordem.id,
              tipo: ordem.tipo as 'DESCARGA' | 'COLETA',
              numero_nota: ordem.numero_nota,
              serie: ordem.serie || '',
              volumes: volumes.map((v) => ({
                id: v.id,
                codigo_barras: v.codigo_barras,
                descricao: v.descricao,
                quantidade: v.quantidade,
              })),
            };
          }),
        );

        return {
          id: cliente.id,
          nome_comercial: cliente.nome_comercial,
          nome_formal: cliente.nome_formal,
          endereco: cliente.endereco,
          cidade: cliente.cidade,
          ordem_na_rota: cliente.ordem_na_rota,
          ordens: ordensPayload,
        };
      }),
    );

    // 5. Marcar rota como em_carga + registrar dt_sync_down
    rota.status = 'em_carga';
    rota.dt_sync_down = new Date();
    await this.rotaRepo.save(rota);

    this.logger.log(`[SYNC-DOWN] Payload montado: ${clientes.length} clientes, ${cargaVolumes.length} volumes na carga`);

    // 6. Retornar SyncDownPayload
    return {
      rota: {
        id: rota.id,
        motorista_id: rota.motorista_id,
        motorista_nome: rota.motorista_nome,
        placa_veiculo: rota.placa_veiculo,
        ordem_editavel: rota.ordem_editavel,
      },
      carga: {
        id: carga.id,
        volumes: cargaVolumes.map((cv) => ({
          id: cv.id,
          codigo_barras: cv.codigo_barras,
          descricao: cv.descricao,
        })),
      },
      clientes: clientesPayload,
    };
  }

  // ================================================================
  // SYNC UP
  // ================================================================

  /**
   * Processa SyncUpPayload recebido do dispositivo.
   * Atualiza todos os status de carga, clientes, ordens e volumes no banco.
   */
  async syncUp(dto: SyncUpDto) {
    this.logger.log(`[SYNC-UP] Processando rota ${dto.rota_id}`);

    // 1. Verificar se rota existe
    const rota = await this.rotaRepo.findOne({ where: { id: dto.rota_id } });
    if (!rota) {
      throw new NotFoundException(`Rota ${dto.rota_id} não encontrada`);
    }

    // 2. Atualizar rota
    rota.status = 'finalizada';
    rota.dt_sync_down = dto.dt_sync_down ? new Date(dto.dt_sync_down) : rota.dt_sync_down;
    rota.dt_sync_up = new Date(dto.dt_sync_up);
    await this.rotaRepo.save(rota);

    // 3. Atualizar carga
    const cargaData = dto.carga;
    const carga = await this.cargaRepo.findOne({ where: { id: cargaData.id } });
    if (carga) {
      carga.status = cargaData.status;
      carga.dt_inicio = cargaData.dt_inicio ? new Date(cargaData.dt_inicio) : null;
      carga.dt_fim = cargaData.dt_fim ? new Date(cargaData.dt_fim) : null;

      // Contar bipados
      const bipados = cargaData.volumes.filter((v) => v.status === 'bipado').length;
      carga.volumes_bipados = bipados;
      carga.volumes_pendentes = carga.total_volumes - bipados;

      await this.cargaRepo.save(carga);

      // Atualizar volumes da carga
      for (const volData of cargaData.volumes) {
        await this.cargaVolumeRepo.update(volData.id, {
          status: volData.status,
          dt_bipagem: volData.dt_bipagem ? new Date(volData.dt_bipagem) : null,
        });
      }
    }

    // 4. Atualizar clientes, ordens e volumes
    for (const clienteData of dto.clientes) {
      const cliente = await this.clienteRepo.findOne({ where: { id: clienteData.id } });
      if (cliente) {
        cliente.status = clienteData.status;
        cliente.dt_inicio = clienteData.dt_inicio ? new Date(clienteData.dt_inicio) : null;
        cliente.dt_fim = clienteData.dt_fim ? new Date(clienteData.dt_fim) : null;

        // Contar ordens finalizadas
        const ordensFinalizadas = clienteData.ordens.filter((o) => o.status === 'finalizada').length;
        cliente.ordens_finalizadas = ordensFinalizadas;

        await this.clienteRepo.save(cliente);

        for (const ordemData of clienteData.ordens) {
          const ordem = await this.ordemRepo.findOne({ where: { id: ordemData.id } });
          if (ordem) {
            ordem.status = ordemData.status;
            ordem.dt_inicio = ordemData.dt_inicio ? new Date(ordemData.dt_inicio) : null;
            ordem.dt_fim = ordemData.dt_fim ? new Date(ordemData.dt_fim) : null;

            // Contar volumes resolvidos
            const resolvidos = ordemData.volumes.filter(
              (v) => v.status === 'entregue' || v.status === 'extraviado',
            ).length;
            ordem.volumes_resolvidos = resolvidos;

            await this.ordemRepo.save(ordem);

            for (const volData of ordemData.volumes) {
              await this.volumeRepo.update(volData.id, {
                status: volData.status,
                observacao: volData.observacao,
                dt_bipagem: volData.dt_bipagem ? new Date(volData.dt_bipagem) : null,
              });
            }
          }
        }
      }
    }

    this.logger.log(`[SYNC-UP] Rota ${dto.rota_id} processada com sucesso`);
  }

  // ================================================================
  // QUERIES
  // ================================================================

  /**
   * Lista rotas com status 'pendente' (disponíveis para sync down)
   */
  async listarRotasDisponiveis() {
    const rotas = await this.rotaRepo.find({
      where: { status: 'pendente' },
      order: { created_at: 'DESC' },
    });

    return rotas.map((r) => ({
      id: r.id,
      motorista_id: r.motorista_id,
      motorista_nome: r.motorista_nome,
      placa_veiculo: r.placa_veiculo,
      status: r.status,
      created_at: r.created_at,
    }));
  }

  /**
   * Verifica se motorista tem rota disponível para sync down
   */
  async verificarRotaDisponivel(motoristaId: string) {
    const rota = await this.rotaRepo.findOne({
      where: { motorista_id: motoristaId, status: 'pendente' },
    });

    return {
      disponivel: !!rota,
      rota_id: rota?.id || null,
      placa_veiculo: rota?.placa_veiculo || null,
    };
  }
}
