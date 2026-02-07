import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EntregaService } from './entrega.service';
import { EntregaRota } from './entities/entrega-rota.entity';
import { EntregaCarga } from './entities/entrega-carga.entity';
import { EntregaCargaVolume } from './entities/entrega-carga-volume.entity';
import { EntregaCliente } from './entities/entrega-cliente.entity';
import { EntregaOrdem } from './entities/entrega-ordem.entity';
import { EntregaVolume } from './entities/entrega-volume.entity';

// Mock factory for TypeORM Repository
const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('EntregaService', () => {
  let service: EntregaService;
  let rotaRepo: ReturnType<typeof mockRepository>;
  let cargaRepo: ReturnType<typeof mockRepository>;
  let cargaVolumeRepo: ReturnType<typeof mockRepository>;
  let clienteRepo: ReturnType<typeof mockRepository>;
  let ordemRepo: ReturnType<typeof mockRepository>;
  let volumeRepo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntregaService,
        { provide: getRepositoryToken(EntregaRota), useFactory: mockRepository },
        { provide: getRepositoryToken(EntregaCarga), useFactory: mockRepository },
        { provide: getRepositoryToken(EntregaCargaVolume), useFactory: mockRepository },
        { provide: getRepositoryToken(EntregaCliente), useFactory: mockRepository },
        { provide: getRepositoryToken(EntregaOrdem), useFactory: mockRepository },
        { provide: getRepositoryToken(EntregaVolume), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<EntregaService>(EntregaService);
    rotaRepo = module.get(getRepositoryToken(EntregaRota));
    cargaRepo = module.get(getRepositoryToken(EntregaCarga));
    cargaVolumeRepo = module.get(getRepositoryToken(EntregaCargaVolume));
    clienteRepo = module.get(getRepositoryToken(EntregaCliente));
    ordemRepo = module.get(getRepositoryToken(EntregaOrdem));
    volumeRepo = module.get(getRepositoryToken(EntregaVolume));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // SYNC DOWN
  // ============================================================

  describe('syncDown', () => {
    const mockRota: Partial<EntregaRota> = {
      id: 'rota-001',
      motorista_id: 'mot-001',
      motorista_nome: 'João Silva',
      placa_veiculo: 'ABC-1234',
      ordem_editavel: false,
      status: 'pendente',
    };

    const mockCarga: Partial<EntregaCarga> = {
      id: 'carga-001',
      rota_id: 'rota-001',
    };

    const mockCargaVolumes: Partial<EntregaCargaVolume>[] = [
      { id: 'cv-001', carga_id: 'carga-001', codigo_barras: '7891234567890', descricao: 'Caixa A' },
      { id: 'cv-002', carga_id: 'carga-001', codigo_barras: '7891234567891', descricao: 'Caixa B' },
    ];

    const mockClientes: Partial<EntregaCliente>[] = [
      {
        id: 'cli-001',
        rota_id: 'rota-001',
        nome_comercial: 'Loja X',
        nome_formal: 'Loja X LTDA',
        endereco: 'Rua A, 100',
        cidade: 'São Paulo',
        ordem_na_rota: 1,
      },
    ];

    const mockOrdens: Partial<EntregaOrdem>[] = [
      { id: 'ord-001', cliente_id: 'cli-001', tipo: 'DESCARGA', numero_nota: '12345', serie: '1' },
    ];

    const mockVolumes: Partial<EntregaVolume>[] = [
      { id: 'vol-001', ordem_id: 'ord-001', codigo_barras: '7891234567890', descricao: 'Caixa A', quantidade: 1 },
    ];

    it('should assemble SyncDownPayload correctly', async () => {
      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue({ ...mockRota, status: 'em_carga' });
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaVolumeRepo.find.mockResolvedValue(mockCargaVolumes);
      clienteRepo.find.mockResolvedValue(mockClientes);
      ordemRepo.find.mockResolvedValue(mockOrdens);
      volumeRepo.find.mockResolvedValue(mockVolumes);

      const result = await service.syncDown('mot-001');

      // Verify payload structure
      expect(result.rota).toBeDefined();
      expect(result.rota.id).toBe('rota-001');
      expect(result.rota.motorista_id).toBe('mot-001');
      expect(result.rota.motorista_nome).toBe('João Silva');
      expect(result.rota.placa_veiculo).toBe('ABC-1234');
      expect(result.rota.ordem_editavel).toBe(false);

      expect(result.carga).toBeDefined();
      expect(result.carga.id).toBe('carga-001');
      expect(result.carga.volumes).toHaveLength(2);
      expect(result.carga.volumes[0].codigo_barras).toBe('7891234567890');

      expect(result.clientes).toHaveLength(1);
      expect(result.clientes[0].nome_comercial).toBe('Loja X');
      expect(result.clientes[0].ordens).toHaveLength(1);
      expect(result.clientes[0].ordens[0].volumes).toHaveLength(1);

      // Verify rota was updated to em_carga
      expect(rotaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'em_carga' }),
      );
    });

    it('should throw NotFoundException if no pending route', async () => {
      rotaRepo.findOne.mockResolvedValue(null);

      await expect(service.syncDown('mot-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no carga found', async () => {
      rotaRepo.findOne.mockResolvedValue(mockRota);
      cargaRepo.findOne.mockResolvedValue(null);

      await expect(service.syncDown('mot-001')).rejects.toThrow(NotFoundException);
    });

    it('should update rota status to em_carga on successful syncDown', async () => {
      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue({ ...mockRota, status: 'em_carga' });
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaVolumeRepo.find.mockResolvedValue(mockCargaVolumes);
      clienteRepo.find.mockResolvedValue(mockClientes);
      ordemRepo.find.mockResolvedValue(mockOrdens);
      volumeRepo.find.mockResolvedValue(mockVolumes);

      await service.syncDown('mot-001');

      expect(rotaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rota-001',
          status: 'em_carga',
        }),
      );
    });

    it('should fetch carga volumes for the route', async () => {
      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue({ ...mockRota, status: 'em_carga' });
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaVolumeRepo.find.mockResolvedValue(mockCargaVolumes);
      clienteRepo.find.mockResolvedValue(mockClientes);
      ordemRepo.find.mockResolvedValue(mockOrdens);
      volumeRepo.find.mockResolvedValue(mockVolumes);

      await service.syncDown('mot-001');

      expect(cargaVolumeRepo.find).toHaveBeenCalled();
    });

    it('should fetch all clientes for the route', async () => {
      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue({ ...mockRota, status: 'em_carga' });
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaVolumeRepo.find.mockResolvedValue(mockCargaVolumes);
      clienteRepo.find.mockResolvedValue(mockClientes);
      ordemRepo.find.mockResolvedValue(mockOrdens);
      volumeRepo.find.mockResolvedValue(mockVolumes);

      await service.syncDown('mot-001');

      expect(clienteRepo.find).toHaveBeenCalled();
    });
  });

  // ============================================================
  // SYNC UP
  // ============================================================

  describe('syncUp', () => {
    const mockSyncUpDto = {
      rota_id: 'rota-001',
      motorista_id: 'mot-001',
      dt_sync_down: '2026-02-06T10:00:00.000Z',
      dt_sync_up: '2026-02-06T18:00:00.000Z',
      carga: {
        id: 'carga-001',
        status: 'finalizada',
        dt_inicio: '2026-02-06T10:05:00.000Z',
        dt_fim: '2026-02-06T10:30:00.000Z',
        volumes: [
          { id: 'cv-001', status: 'bipado', dt_bipagem: '2026-02-06T10:10:00.000Z' },
          { id: 'cv-002', status: 'bipado', dt_bipagem: '2026-02-06T10:15:00.000Z' },
        ],
      },
      clientes: [
        {
          id: 'cli-001',
          status: 'finalizado',
          dt_inicio: '2026-02-06T11:00:00.000Z',
          dt_fim: '2026-02-06T11:30:00.000Z',
          ordens: [
            {
              id: 'ord-001',
              status: 'finalizada',
              dt_inicio: '2026-02-06T11:00:00.000Z',
              dt_fim: '2026-02-06T11:25:00.000Z',
              volumes: [
                { id: 'vol-001', status: 'entregue', observacao: null, dt_bipagem: '2026-02-06T11:10:00.000Z' },
              ],
            },
          ],
        },
      ],
    };

    it('should process sync up successfully', async () => {
      const mockRota = { id: 'rota-001', status: 'em_rota', dt_sync_down: null, dt_sync_up: null };
      const mockCarga = { id: 'carga-001', status: 'aguardando', total_volumes: 2, volumes_bipados: 0, volumes_pendentes: 2 };
      const mockCliente = { id: 'cli-001', status: 'aguardando', ordens_finalizadas: 0 };
      const mockOrdem = { id: 'ord-001', status: 'aguardando', volumes_resolvidos: 0 };

      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue(mockRota);
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaRepo.save.mockResolvedValue(mockCarga);
      cargaVolumeRepo.update.mockResolvedValue({ affected: 1 });
      clienteRepo.findOne.mockResolvedValue(mockCliente);
      clienteRepo.save.mockResolvedValue(mockCliente);
      ordemRepo.findOne.mockResolvedValue(mockOrdem);
      ordemRepo.save.mockResolvedValue(mockOrdem);
      volumeRepo.update.mockResolvedValue({ affected: 1 });

      await service.syncUp(mockSyncUpDto);

      // Rota deve ser marcada como finalizada
      expect(rotaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'finalizada' }),
      );

      // Carga deve ter bipados atualizados
      expect(cargaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'finalizada', volumes_bipados: 2 }),
      );

      // Volumes da carga devem ser atualizados
      expect(cargaVolumeRepo.update).toHaveBeenCalledTimes(2);

      // Cliente deve ter ordens_finalizadas contado
      expect(clienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'finalizado', ordens_finalizadas: 1 }),
      );

      // Ordem deve ter volumes_resolvidos contado
      expect(ordemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'finalizada', volumes_resolvidos: 1 }),
      );

      // Volume deve ser atualizado
      expect(volumeRepo.update).toHaveBeenCalledWith('vol-001', {
        status: 'entregue',
        observacao: null,
        dt_bipagem: expect.any(Date),
      });
    });

    it('should throw NotFoundException if rota not found', async () => {
      rotaRepo.findOne.mockResolvedValue(null);

      await expect(service.syncUp(mockSyncUpDto)).rejects.toThrow(NotFoundException);
    });

    it('should skip carga update if carga not found', async () => {
      const mockRota = { id: 'rota-001', status: 'em_rota', dt_sync_down: null, dt_sync_up: null };
      const mockCliente = { id: 'cli-001', status: 'aguardando', ordens_finalizadas: 0 };
      const mockOrdem = { id: 'ord-001', status: 'aguardando', volumes_resolvidos: 0 };

      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue(mockRota);
      cargaRepo.findOne.mockResolvedValue(null);
      clienteRepo.findOne.mockResolvedValue(mockCliente);
      clienteRepo.save.mockResolvedValue(mockCliente);
      ordemRepo.findOne.mockResolvedValue(mockOrdem);
      ordemRepo.save.mockResolvedValue(mockOrdem);
      volumeRepo.update.mockResolvedValue({ affected: 1 });

      await service.syncUp(mockSyncUpDto);

      // Carga save should NOT have been called
      expect(cargaRepo.save).not.toHaveBeenCalled();
      // But rota should still be finalizada
      expect(rotaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'finalizada' }),
      );
    });

    it('should update all carga volumes with correct status', async () => {
      const mockRota = { id: 'rota-001', status: 'em_rota' };
      const mockCarga = { id: 'carga-001', status: 'aguardando', total_volumes: 2, volumes_bipados: 0 };
      const mockCliente = { id: 'cli-001', status: 'aguardando' };
      const mockOrdem = { id: 'ord-001', status: 'aguardando' };

      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue(mockRota);
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaRepo.save.mockResolvedValue(mockCarga);
      cargaVolumeRepo.update.mockResolvedValue({ affected: 1 });
      clienteRepo.findOne.mockResolvedValue(mockCliente);
      clienteRepo.save.mockResolvedValue(mockCliente);
      ordemRepo.findOne.mockResolvedValue(mockOrdem);
      ordemRepo.save.mockResolvedValue(mockOrdem);
      volumeRepo.update.mockResolvedValue({ affected: 1 });

      await service.syncUp(mockSyncUpDto);

      expect(cargaVolumeRepo.update).toHaveBeenCalledTimes(2);
      expect(cargaVolumeRepo.update).toHaveBeenCalledWith('cv-001', {
        status: 'bipado',
        dt_bipagem: expect.any(Date),
      });
      expect(cargaVolumeRepo.update).toHaveBeenCalledWith('cv-002', {
        status: 'bipado',
        dt_bipagem: expect.any(Date),
      });
    });

    it('should update all volumes in ordens with correct status', async () => {
      const mockRota = { id: 'rota-001', status: 'em_rota' };
      const mockCarga = { id: 'carga-001', status: 'aguardando', total_volumes: 2, volumes_bipados: 0 };
      const mockCliente = { id: 'cli-001', status: 'aguardando' };
      const mockOrdem = { id: 'ord-001', status: 'aguardando' };

      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue(mockRota);
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaRepo.save.mockResolvedValue(mockCarga);
      cargaVolumeRepo.update.mockResolvedValue({ affected: 1 });
      clienteRepo.findOne.mockResolvedValue(mockCliente);
      clienteRepo.save.mockResolvedValue(mockCliente);
      ordemRepo.findOne.mockResolvedValue(mockOrdem);
      ordemRepo.save.mockResolvedValue(mockOrdem);
      volumeRepo.update.mockResolvedValue({ affected: 1 });

      await service.syncUp(mockSyncUpDto);

      expect(volumeRepo.update).toHaveBeenCalledWith('vol-001', {
        status: 'entregue',
        observacao: null,
        dt_bipagem: expect.any(Date),
      });
    });

    it('should count finalized orders per cliente', async () => {
      const mockRota = { id: 'rota-001', status: 'em_rota' };
      const mockCarga = { id: 'carga-001', status: 'aguardando', total_volumes: 2, volumes_bipados: 0 };
      const mockCliente = { id: 'cli-001', status: 'aguardando', ordens_finalizadas: 0 };
      const mockOrdem = { id: 'ord-001', status: 'aguardando' };

      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue(mockRota);
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaRepo.save.mockResolvedValue(mockCarga);
      cargaVolumeRepo.update.mockResolvedValue({ affected: 1 });
      clienteRepo.findOne.mockResolvedValue(mockCliente);
      clienteRepo.save.mockResolvedValue(mockCliente);
      ordemRepo.findOne.mockResolvedValue(mockOrdem);
      ordemRepo.save.mockResolvedValue(mockOrdem);
      volumeRepo.update.mockResolvedValue({ affected: 1 });

      await service.syncUp(mockSyncUpDto);

      expect(clienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cli-001',
          status: 'finalizado',
          ordens_finalizadas: 1,
        }),
      );
    });

    it('should mark rota as finalizada after processing all clientes', async () => {
      const mockRota = { id: 'rota-001', status: 'em_rota' };
      const mockCarga = { id: 'carga-001', status: 'aguardando', total_volumes: 2, volumes_bipados: 0 };
      const mockCliente = { id: 'cli-001', status: 'aguardando' };
      const mockOrdem = { id: 'ord-001', status: 'aguardando' };

      rotaRepo.findOne.mockResolvedValue(mockRota);
      rotaRepo.save.mockResolvedValue(mockRota);
      cargaRepo.findOne.mockResolvedValue(mockCarga);
      cargaRepo.save.mockResolvedValue(mockCarga);
      cargaVolumeRepo.update.mockResolvedValue({ affected: 1 });
      clienteRepo.findOne.mockResolvedValue(mockCliente);
      clienteRepo.save.mockResolvedValue(mockCliente);
      ordemRepo.findOne.mockResolvedValue(mockOrdem);
      ordemRepo.save.mockResolvedValue(mockOrdem);
      volumeRepo.update.mockResolvedValue({ affected: 1 });

      await service.syncUp(mockSyncUpDto);

      expect(rotaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rota-001',
          status: 'finalizada',
        }),
      );
    });
  });

  // ============================================================
  // QUERIES
  // ============================================================

  describe('listarRotasDisponiveis', () => {
    it('should return pending routes', async () => {
      const mockRotas = [
        { id: 'rota-001', motorista_id: 'mot-001', motorista_nome: 'João', placa_veiculo: 'ABC-1234', status: 'pendente', created_at: new Date() },
        { id: 'rota-002', motorista_id: 'mot-002', motorista_nome: 'Pedro', placa_veiculo: 'XYZ-5678', status: 'pendente', created_at: new Date() },
      ];

      rotaRepo.find.mockResolvedValue(mockRotas);

      const result = await service.listarRotasDisponiveis();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('rota-001');
      expect(result[1].motorista_nome).toBe('Pedro');
      expect(rotaRepo.find).toHaveBeenCalledWith({
        where: { status: 'pendente' },
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array if no pending routes', async () => {
      rotaRepo.find.mockResolvedValue([]);

      const result = await service.listarRotasDisponiveis();

      expect(result).toHaveLength(0);
    });

    it('should order routes by creation date descending', async () => {
      const mockRotas = [
        { id: 'rota-001', motorista_id: 'mot-001', motorista_nome: 'João', placa_veiculo: 'ABC-1234', status: 'pendente', created_at: new Date('2026-02-07') },
        { id: 'rota-002', motorista_id: 'mot-002', motorista_nome: 'Pedro', placa_veiculo: 'XYZ-5678', status: 'pendente', created_at: new Date('2026-02-06') },
      ];

      rotaRepo.find.mockResolvedValue(mockRotas);

      await service.listarRotasDisponiveis();

      expect(rotaRepo.find).toHaveBeenCalledWith({
        where: { status: 'pendente' },
        order: { created_at: 'DESC' },
      });
    });

    it('should only return routes with status pendente', async () => {
      const mockRotas = [
        { id: 'rota-001', motorista_id: 'mot-001', motorista_nome: 'João', placa_veiculo: 'ABC-1234', status: 'pendente', created_at: new Date() },
      ];

      rotaRepo.find.mockResolvedValue(mockRotas);

      await service.listarRotasDisponiveis();

      expect(rotaRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pendente' },
        }),
      );
    });
  });

  describe('verificarRotaDisponivel', () => {
    it('should return disponivel=true when route exists', async () => {
      rotaRepo.findOne.mockResolvedValue({ id: 'rota-001', placa_veiculo: 'ABC-1234' });

      const result = await service.verificarRotaDisponivel('mot-001');

      expect(result.disponivel).toBe(true);
      expect(result.rota_id).toBe('rota-001');
      expect(result.placa_veiculo).toBe('ABC-1234');
    });

    it('should return disponivel=false when no route', async () => {
      rotaRepo.findOne.mockResolvedValue(null);

      const result = await service.verificarRotaDisponivel('mot-999');

      expect(result.disponivel).toBe(false);
      expect(result.rota_id).toBeNull();
    });

    it('should query by motorista_id and pending status', async () => {
      rotaRepo.findOne.mockResolvedValue({ id: 'rota-001', placa_veiculo: 'ABC-1234' });

      await service.verificarRotaDisponivel('mot-001');

      expect(rotaRepo.findOne).toHaveBeenCalledWith({
        where: {
          motorista_id: 'mot-001',
          status: 'pendente',
        },
      });
    });

    it('should include placa_veiculo in response', async () => {
      const mockRota = {
        id: 'rota-001',
        placa_veiculo: 'ABC-1234',
        motorista_id: 'mot-001',
      };

      rotaRepo.findOne.mockResolvedValue(mockRota);

      const result = await service.verificarRotaDisponivel('mot-001');

      expect(result.disponivel).toBe(true);
      expect(result.rota_id).toBe('rota-001');
      expect(result.placa_veiculo).toBe('ABC-1234');
    });

    it('should return null rota_id when route not found', async () => {
      rotaRepo.findOne.mockResolvedValue(null);

      const result = await service.verificarRotaDisponivel('mot-999');

      expect(result.rota_id).toBeNull();
    });

    it('should return complete route info when route is available', async () => {
      const mockRota = {
        id: 'rota-001',
        placa_veiculo: 'ABC-1234',
        motorista_nome: 'João Silva',
        motorista_id: 'mot-001',
        status: 'pendente',
      };

      rotaRepo.findOne.mockResolvedValue(mockRota);

      const result = await service.verificarRotaDisponivel('mot-001');

      expect(result).toMatchObject({
        disponivel: true,
        rota_id: 'rota-001',
        placa_veiculo: 'ABC-1234',
      });
    });
  });
});
