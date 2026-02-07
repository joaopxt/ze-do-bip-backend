import { Test, TestingModule } from '@nestjs/testing';
import { PrdLojaController } from './prd_loja.controller';
import { PrdLojaService } from './prd_loja.service';

describe('PrdLojaController', () => {
  let controller: PrdLojaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrdLojaController],
      providers: [PrdLojaService],
    }).compile();

    controller = module.get<PrdLojaController>(PrdLojaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
