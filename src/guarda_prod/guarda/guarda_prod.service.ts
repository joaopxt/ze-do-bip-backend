import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';
import { SiacConfig } from '../config/siac.config';
import {
  GuardaProd,
  DetalhesGuardaProd,
  ApiCallResult,
  CacheStats,
} from './interfaces/guarda_prod.interface';

/**
 * Service para operações de GuardaProd - APENAS LOJA 01 (PECISTA)
 */
@Injectable()
export class GuardaProdService {
  private readonly logger = new Logger(GuardaProdService.name);
  private readonly httpsAgent: https.Agent;

  constructor(private readonly httpService: HttpService) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false, // APIs SIAC usam certificados auto-assinados
    });

    this.logger.log('GuardaProdService inicializado APENAS para LOJA 01 (PECISTA)');
  }

  /**
   * Listar todas as guardas disponíveis da loja 01
   */
  async listarGuardas(cdUsuario?: string): Promise<GuardaProd[]> {
    const reqId = this.generateRequestId();

    try {
      this.logger.log(`[${reqId}] Listando guardas da loja 01 - usuário: ${cdUsuario || 'TODOS'}`);

      const url = SiacConfig.getListarGuardasUrl();
      const payload = cdUsuario ? { cd_usuario: cdUsuario } : {};

      const response = await this.callApi<{ data: GuardaProd[] }>(url, payload, reqId);

      this.logger.log(`[${reqId}] Guardas listadas: ${response?.data?.length || 0} registros`);

      return response.data || [];
    } catch (error) {
      this.logger.error(`[${reqId}] Erro ao listar guardas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obter detalhes de uma guarda específica
   */
  async obterDetalhes(sqGuarda: string): Promise<DetalhesGuardaProd> {
    const reqId = this.generateRequestId();

    try {
      this.logger.log(`[${reqId}] Obtendo detalhes da guarda ${sqGuarda}`);

      const url = SiacConfig.getDetalhesGuardaUrl();
      const payload = { sq_guarda: sqGuarda };

      const response = await this.callApi<{ data: DetalhesGuardaProd }>(url, payload, reqId);

      this.logger.log(`[${reqId}] Detalhes obtidos para guarda ${sqGuarda}`);

      return response.data;
    } catch (error) {
      this.logger.error(`[${reqId}] Erro ao obter detalhes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Iniciar uma guarda
   */
  async iniciarGuarda(sqGuarda: string): Promise<any> {
    const reqId = this.generateRequestId();

    try {
      this.logger.log(`[${reqId}] Iniciando guarda ${sqGuarda}`);

      const url = SiacConfig.getIniciarGuardaUrl();
      const payload = { sq_guarda: sqGuarda };

      const response = await this.callApi(url, payload, reqId);

      this.logger.log(`[${reqId}] Guarda ${sqGuarda} iniciada com sucesso`);

      return response;
    } catch (error) {
      this.logger.error(`[${reqId}] Erro ao iniciar guarda: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finalizar uma guarda
   */
  async finalizarGuarda(sqGuarda: string): Promise<any> {
    const reqId = this.generateRequestId();

    try {
      this.logger.log(`[${reqId}] Finalizando guarda ${sqGuarda}`);

      const url = SiacConfig.getFinalizarGuardaUrl();
      const payload = { sq_guarda: sqGuarda };

      const response = await this.callApi(url, payload, reqId);

      this.logger.log(`[${reqId}] Guarda ${sqGuarda} finalizada com sucesso`);

      return response;
    } catch (error) {
      this.logger.error(`[${reqId}] Erro ao finalizar guarda: ${error.message}`);
      throw error;
    }
  }

  /**
   * Testar conectividade com API SIAC
   */
  async testarConectividade(): Promise<ApiCallResult> {
    const reqId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.logger.log(`[${reqId}] Testando conectividade com SIAC`);

      await this.listarGuardas();
      const duration = Date.now() - startTime;

      return {
        success: true,
        latency: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Realizar chamada à API SIAC (sempre POST)
   */
  private async callApi<T>(endpoint: string, payload: any, reqId: string): Promise<T> {
    const startTime = Date.now();

    this.logger.debug(`[${reqId}] POST ${endpoint}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(endpoint, payload, {
          timeout: SiacConfig.TIMEOUT,
          httpsAgent: this.httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NestJS-GuardaService/1.0',
          },
        }),
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`[${reqId}] Response: ${response.status} em ${duration}ms`);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[${reqId}] API call failed após ${duration}ms: ${error.message}`);

      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'Timeout na conexão com SIAC',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw new HttpException(
        error.response?.data?.message || error.message || 'Erro na comunicação com SIAC',
        error.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Gerar ID único para rastreamento de requisição
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validar se loja é válida (apenas 01)
   */
  isLojaValida(cdLoja: string): boolean {
    return SiacConfig.isLojaValida(cdLoja);
  }

  /**
   * Obter informações da loja
   */
  getLojaInfo() {
    return SiacConfig.getLojaInfo();
  }
}
