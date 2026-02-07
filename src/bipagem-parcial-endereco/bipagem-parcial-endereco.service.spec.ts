import { Test, TestingModule } from '@nestjs/testing';
import { BipagemParcialEnderecoService } from './bipagem-parcial-endereco.service';

describe('BipagemParcialEnderecoService', () => {
  let service: BipagemParcialEnderecoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BipagemParcialEnderecoService],
    }).compile();

    service = module.get<BipagemParcialEnderecoService>(BipagemParcialEnderecoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
