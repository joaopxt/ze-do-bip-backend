import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GuardaProdController } from './guarda_prod.controller';
import { GuardaProdService } from './guarda_prod.service';
import { AuthModule } from 'src/auth/auth.module';

/**
 * Módulo de GuardaProd - NestJS
 * Encapsula toda a lógica de operações de guarda para LOJA 01 (PECISTA)
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    AuthModule,
  ],
  controllers: [GuardaProdController],
  providers: [GuardaProdService],
  exports: [GuardaProdService], // Exporta para uso em outros módulos
})
export class GuardaProdModule {}
