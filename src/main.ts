import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração de CORS para permitir requisições do app React Native (APK)
  app.enableCors({
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : true, // Permite todas as origens se não especificado
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true, // Permite envio de cookies/credenciais
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
