import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';
import { Produto } from './entities/produto.entity';
import { EnderecoId } from 'src/guarda/entities/endereco-id.entity';
import { PrdLoja } from 'src/prd_loja/entities/prd_loja.entity';
import { ProdutosGuarda } from 'src/produtos_guarda/entities/produtos_guarda.entity';
import { CallSiacService } from 'src/utils/call_siac.service';
import { UtilsModule } from 'src/utils/utils.module';
import { AuthModule } from 'src/auth/auth.module';
import { BipagemParcialEnderecoModule } from 'src/bipagem-parcial-endereco/bipagem-parcial-endereco.module';
import { Guarda } from 'src/guarda/entities/guarda.entity';
import { BipagemParcialEndereco } from 'src/bipagem-parcial-endereco/entities/bipagem-parcial-endereco.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Produto,
      EnderecoId,
      PrdLoja,
      ProdutosGuarda,
      Guarda,
      BipagemParcialEndereco,
    ]),
    UtilsModule,
    AuthModule,
    BipagemParcialEnderecoModule,
  ],
  controllers: [ProdutosController],
  providers: [ProdutosService],
  exports: [ProdutosService],
})
export class ProdutosModule {}
