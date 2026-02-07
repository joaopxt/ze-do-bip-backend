// Mock dos módulos de auth antes de importar o controller
jest.mock('src/auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}), { virtual: true });

jest.mock('src/auth/guards/permissions.guard', () => ({
  PermissionsGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}), { virtual: true });

jest.mock('src/auth/decorators/permissions.decorator', () => ({
  Permissions: () => jest.fn(),
  PERMISSIONS_KEY: 'permissions',
}), { virtual: true });

jest.mock('src/auth/decorators/public.decorator', () => ({
  Public: () => jest.fn(),
  IS_PUBLIC_KEY: 'isPublic',
}), { virtual: true });

import { Test, TestingModule } from '@nestjs/testing';
import { EntregaController } from './entrega.controller';
import { EntregaService } from './entrega.service';

const mockEntregaService = {
  syncDown: jest.fn(),
  syncUp: jest.fn(),
  listarRotasDisponiveis: jest.fn(),
  verificarRotaDisponivel: jest.fn(),
};

describe('EntregaController', () => {
  let controller: EntregaController;
  let service: typeof mockEntregaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntregaController],
      providers: [
        { provide: EntregaService, useValue: mockEntregaService },
      ],
    }).compile();

    controller = module.get<EntregaController>(EntregaController);
    service = module.get(EntregaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('health', () => {
    it('should return success with online status', async () => {
      const result = await controller.health();

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('online');
      expect(result.data.modulo).toBe('entrega');
      expect(result.data.timestamp).toBeDefined();
    });
  });

  describe('syncDown', () => {
    it('should return success with payload', async () => {
      const mockPayload = {
        rota: { id: 'rota-001', motorista_id: 'mot-001', motorista_nome: 'João', placa_veiculo: 'ABC-1234', ordem_editavel: false },
        carga: { id: 'carga-001', volumes: [] },
        clientes: [],
      };
      service.syncDown.mockResolvedValue(mockPayload);

      const result = await controller.syncDown({ motorista_id: 'mot-001' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayload);
      expect(service.syncDown).toHaveBeenCalledWith('mot-001');
    });
  });

  describe('syncUp', () => {
    it('should return success message', async () => {
      service.syncUp.mockResolvedValue(undefined);

      const dto = {
        rota_id: 'rota-001',
        motorista_id: 'mot-001',
        dt_sync_down: '2026-02-06T10:00:00.000Z',
        dt_sync_up: '2026-02-06T18:00:00.000Z',
        carga: { id: 'carga-001', status: 'finalizada', dt_inicio: null, dt_fim: null, volumes: [] },
        clientes: [],
      };

      const result = await controller.syncUp(dto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
      expect(service.syncUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('listarRotas', () => {
    it('should return list with total', async () => {
      const mockRotas = [
        { id: 'rota-001', motorista_nome: 'João', status: 'pendente' },
        { id: 'rota-002', motorista_nome: 'Pedro', status: 'pendente' },
      ];
      service.listarRotasDisponiveis.mockResolvedValue(mockRotas);

      const result = await controller.listarRotas();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('verificarRotaDisponivel', () => {
    it('should return disponivel data directly (no wrapper)', async () => {
      const mockDisponivel = { disponivel: true, rota_id: 'rota-001', placa_veiculo: 'ABC-1234' };
      service.verificarRotaDisponivel.mockResolvedValue(mockDisponivel);

      const result = await controller.verificarRotaDisponivel('mot-001');

      expect(result.disponivel).toBe(true);
      expect(result.rota_id).toBe('rota-001');
      expect(service.verificarRotaDisponivel).toHaveBeenCalledWith('mot-001');
    });
  });
});
