import { Test, TestingModule } from '@nestjs/testing';
import { GuardaService } from './guarda.service';

describe('GuardaService', () => {
  let service: GuardaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardaService],
    }).compile();

    service = module.get<GuardaService>(GuardaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
