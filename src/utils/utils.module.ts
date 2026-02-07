import { Module } from '@nestjs/common';
import { CallSiacService } from './call_siac.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [CallSiacService],
  exports: [CallSiacService],
})
export class UtilsModule {}
