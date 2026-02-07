import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';
import * as https from 'https';
import { SiacConfig } from 'src/guarda_prod/config/siac.config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class CallSiacService {
  private readonly logger = new Logger(CallSiacService.name);
  private readonly httpsAgent: https.Agent;

  constructor(private readonly httpService: HttpService) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false, // APIs SIAC usam certificados auto-assinados
    });
  }

  public async callApi<T>(
    endpoint: string,
    payload: any,
    reqId: string,
  ): Promise<T> {
    const startTime = Date.now();

    this.logger.debug(`[${reqId}] POST ${endpoint}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(endpoint, payload, {
          timeout: SiacConfig.TIMEOUT,
          httpsAgent: this.httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NestJS-CallSiacService/1.0',
          },
        }),
      );

      const duration = Date.now() - startTime;
      this.logger.debug(
        `[${reqId}] Response: ${response.status} em ${duration}ms`,
      );

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${reqId}] API call failed após ${duration}ms: ${error.message}`,
      );

      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'Timeout na conexão com SIAC',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw new HttpException(
        error.response?.data?.message ||
          error.message ||
          'Erro na comunicação com SIAC',
        error.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
