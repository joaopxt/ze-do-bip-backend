import { Test, TestingModule } from '@nestjs/testing';
import { ProdutosGuardaService } from './produtos_guarda.service';

describe('ProdutosGuardaService', () => {
  let service: ProdutosGuardaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProdutosGuardaService],
    }).compile();

    service = module.get<ProdutosGuardaService>(ProdutosGuardaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
