import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GuardaModule } from './guarda/guarda.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompraModule } from './compra/compra.module';
import { EstoquistaModule } from './estoquista/estoquista.module';
import { FornecedorModule } from './fornecedor/fornecedor.module';
import { GuardaProdModule } from './guarda_prod/guarda/guarda_prod.module';
import { PrdLojaModule } from './prd_loja/prd_loja.module';
import { ProdNfcModule } from './prod_nfc/prod_nfc.module';
import { ProdutosModule } from './produtos/produtos.module';
import { ProdutosGuardaModule } from './produtos_guarda/produtos_guarda.module';
import { UtilsModule } from './utils/utils.module';
import { BipagemParcialEnderecoModule } from './bipagem-parcial-endereco/bipagem-parcial-endereco.module';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>(
          process.env.NODE_ENV === 'development' ? 'DB_HOST_DEV' : 'DB_HOST',
        ),
        port: config.get<number>(
          process.env.NODE_ENV === 'development' ? 'DB_PORT_DEV' : 'DB_PORT',
        ),
        username: config.get<string>(
          process.env.NODE_ENV === 'development'
            ? 'DB_USERNAME_DEV'
            : 'DB_USERNAME',
        ),
        password: config.get<string>(
          process.env.NODE_ENV === 'development'
            ? 'DB_PASSWORD_DEV'
            : 'DB_PASSWORD',
        ),
        database: config.get<string>(
          process.env.NODE_ENV === 'development'
            ? 'DB_DATABASE_DEV'
            : 'DB_DATABASE',
        ),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),
    // Conexao PostgreSQL (nomeada)
    TypeOrmModule.forRootAsync({
      name: 'postgresConnection',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USERNAME'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DATABASE'),
        entities: [],
        synchronize: false,
      }),
    }),
    GuardaModule,
    AuthModule,
    CompraModule,
    EstoquistaModule,
    FornecedorModule,
    GuardaProdModule,
    PrdLojaModule,
    ProdNfcModule,
    ProdutosModule,
    ProdutosGuardaModule,
    UtilsModule,
    BipagemParcialEnderecoModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
