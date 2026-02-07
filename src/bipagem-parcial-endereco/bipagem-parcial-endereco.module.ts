import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BipagemParcialEnderecoService } from './bipagem-parcial-endereco.service';
import { BipagemParcialEnderecoController } from './bipagem-parcial-endereco.controller';
import { BipagemParcialEndereco } from './entities/bipagem-parcial-endereco.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BipagemParcialEndereco])],
  controllers: [BipagemParcialEnderecoController],
  providers: [BipagemParcialEnderecoService],
  exports: [BipagemParcialEnderecoService],
})
export class BipagemParcialEnderecoModule {}
