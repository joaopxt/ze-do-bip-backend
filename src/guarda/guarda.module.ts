import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GuardaService } from './guarda.service';
import { GuardaSyncService } from './guarda-sync.service';
import { GuardaController } from './guarda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guarda } from './entities/guarda.entity';
import { GuardaBackup } from './entities/guarda-backup.entity';
import { EnderecoId } from './entities/endereco-id.entity';
import { Compra } from 'src/compra/entities/compra.entity';
import { Estoquista } from 'src/estoquista/entities/estoquista.entity';
import { ProdNfc } from 'src/prod_nfc/entities/prod_nfc.entity';
import { Fornecedor } from 'src/fornecedor/entities/fornecedor.entity';
import { Produto } from 'src/produtos/entities/produto.entity';
import { PrdLoja } from 'src/prd_loja/entities/prd_loja.entity';
import { ProdutosGuarda } from 'src/produtos_guarda/entities/produtos_guarda.entity';
import { GuardaProdModule } from 'src/guarda_prod/guarda/guarda_prod.module';
import { CompraModule } from 'src/compra/compra.module';
import { EstoquistaModule } from 'src/estoquista/estoquista.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Guarda,
      GuardaBackup,
      EnderecoId,
      Compra,
      Estoquista,
      ProdNfc,
      Fornecedor,
      Produto,
      PrdLoja,
      ProdutosGuarda,
    ]),
    ScheduleModule.forRoot(),
    GuardaProdModule,
    CompraModule,
    EstoquistaModule,
    AuthModule,
  ],
  controllers: [GuardaController],
  providers: [GuardaService, GuardaSyncService],
  exports: [GuardaService, GuardaSyncService],
})
export class GuardaModule {}
