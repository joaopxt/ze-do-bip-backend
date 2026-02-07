import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntregaController } from './entrega.controller';
import { EntregaService } from './entrega.service';
import { EntregaRota } from './entities/entrega-rota.entity';
import { EntregaCarga } from './entities/entrega-carga.entity';
import { EntregaCargaVolume } from './entities/entrega-carga-volume.entity';
import { EntregaCliente } from './entities/entrega-cliente.entity';
import { EntregaOrdem } from './entities/entrega-ordem.entity';
import { EntregaVolume } from './entities/entrega-volume.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntregaRota,
      EntregaCarga,
      EntregaCargaVolume,
      EntregaCliente,
      EntregaOrdem,
      EntregaVolume,
    ]),
    AuthModule,
  ],
  controllers: [EntregaController],
  providers: [EntregaService],
  exports: [EntregaService],
})
export class EntregaModule {}
