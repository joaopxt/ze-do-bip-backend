import { Module } from '@nestjs/common';
import { EstoquistaService } from './estoquista.service';
import { EstoquistaController } from './estoquista.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estoquista } from './entities/estoquista.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Estoquista]), AuthModule],
  controllers: [EstoquistaController],
  providers: [EstoquistaService],
  exports: [EstoquistaService],
})
export class EstoquistaModule {}
