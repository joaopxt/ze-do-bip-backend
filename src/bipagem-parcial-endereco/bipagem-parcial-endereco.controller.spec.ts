import { Test, TestingModule } from '@nestjs/testing';
import { BipagemParcialEnderecoController } from './bipagem-parcial-endereco.controller';
import { BipagemParcialEnderecoService } from './bipagem-parcial-endereco.service';

describe('BipagemParcialEnderecoController', () => {
  let controller: BipagemParcialEnderecoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BipagemParcialEnderecoController],
      providers: [BipagemParcialEnderecoService],
    }).compile();

    controller = module.get<BipagemParcialEnderecoController>(BipagemParcialEnderecoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
