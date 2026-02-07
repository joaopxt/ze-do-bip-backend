import { Test, TestingModule } from '@nestjs/testing';
import { EstoquistaService } from './estoquista.service';

describe('EstoquistaService', () => {
  let service: EstoquistaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstoquistaService],
    }).compile();

    service = module.get<EstoquistaService>(EstoquistaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
