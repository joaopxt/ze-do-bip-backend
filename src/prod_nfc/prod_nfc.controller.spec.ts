import { Test, TestingModule } from '@nestjs/testing';
import { ProdNfcController } from './prod_nfc.controller';
import { ProdNfcService } from './prod_nfc.service';

describe('ProdNfcController', () => {
  let controller: ProdNfcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProdNfcController],
      providers: [ProdNfcService],
    }).compile();

    controller = module.get<ProdNfcController>(ProdNfcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
