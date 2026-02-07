import { Module } from '@nestjs/common';
import { ProdNfcService } from './prod_nfc.service';
import { ProdNfcController } from './prod_nfc.controller';
import { ProdNfc } from './entities/prod_nfc.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from 'src/compra/entities/compra.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProdNfc, Compra]), AuthModule],
  controllers: [ProdNfcController],
  providers: [ProdNfcService],
  exports: [ProdNfcService], // Exportar para uso no CompraService
})
export class ProdNfcModule {}
