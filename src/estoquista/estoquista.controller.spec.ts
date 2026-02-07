import { Test, TestingModule } from '@nestjs/testing';
import { EstoquistaController } from './estoquista.controller';
import { EstoquistaService } from './estoquista.service';

describe('EstoquistaController', () => {
  let controller: EstoquistaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstoquistaController],
      providers: [EstoquistaService],
    }).compile();

    controller = module.get<EstoquistaController>(EstoquistaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
