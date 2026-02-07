import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutosGuardaService } from './produtos_guarda.service';
import { ProdutosGuardaController } from './produtos_guarda.controller';
import { ProdutosGuarda } from './entities/produtos_guarda.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Produto } from 'src/produtos/entities/produto.entity';
import { Guarda } from 'src/guarda/entities/guarda.entity';
import { PrdLoja } from 'src/prd_loja/entities/prd_loja.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProdutosGuarda, Produto, Guarda, PrdLoja]),
    AuthModule,
  ],
  controllers: [ProdutosGuardaController],
  providers: [ProdutosGuardaService],
  exports: [ProdutosGuardaService],
})
export class ProdutosGuardaModule {}
