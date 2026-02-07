import { Test, TestingModule } from '@nestjs/testing';
import { ProdutosGuardaController } from './produtos_guarda.controller';
import { ProdutosGuardaService } from './produtos_guarda.service';

describe('ProdutosGuardaController', () => {
  let controller: ProdutosGuardaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProdutosGuardaController],
      providers: [ProdutosGuardaService],
    }).compile();

    controller = module.get<ProdutosGuardaController>(ProdutosGuardaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
