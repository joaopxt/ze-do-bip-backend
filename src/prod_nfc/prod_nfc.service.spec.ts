import { Test, TestingModule } from '@nestjs/testing';
import { ProdNfcService } from './prod_nfc.service';

describe('ProdNfcService', () => {
  let service: ProdNfcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProdNfcService],
    }).compile();

    service = module.get<ProdNfcService>(ProdNfcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
