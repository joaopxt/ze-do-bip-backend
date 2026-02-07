import { Test, TestingModule } from '@nestjs/testing';
import { PrdLojaService } from './prd_loja.service';

describe('PrdLojaService', () => {
  let service: PrdLojaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrdLojaService],
    }).compile();

    service = module.get<PrdLojaService>(PrdLojaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
