import { Module } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CompraController } from './compra.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { ProdNfcModule } from 'src/prod_nfc/prod_nfc.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Compra]), ProdNfcModule, AuthModule],
  controllers: [CompraController],
  providers: [CompraService],
  exports: [CompraService],
})
export class CompraModule {}
