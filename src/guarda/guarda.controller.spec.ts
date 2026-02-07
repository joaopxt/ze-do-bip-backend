import { Test, TestingModule } from '@nestjs/testing';
import { GuardaController } from './guarda.controller';
import { GuardaService } from './guarda.service';

describe('GuardaController', () => {
  let controller: GuardaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardaController],
      providers: [GuardaService],
    }).compile();

    controller = module.get<GuardaController>(GuardaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
