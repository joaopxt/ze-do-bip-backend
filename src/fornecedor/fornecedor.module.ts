import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FornecedorService } from './fornecedor.service';
import { FornecedorController } from './fornecedor.controller';
import { Fornecedor } from './entities/fornecedor.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Fornecedor]), AuthModule],
  controllers: [FornecedorController],
  providers: [FornecedorService],
  exports: [FornecedorService],
})
export class FornecedorModule {}
