import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrdLojaService } from './prd_loja.service';
import { PrdLojaController } from './prd_loja.controller';
import { PrdLoja } from './entities/prd_loja.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrdLoja]), AuthModule],
  controllers: [PrdLojaController],
  providers: [PrdLojaService],
  exports: [PrdLojaService],
})
export class PrdLojaModule {}
