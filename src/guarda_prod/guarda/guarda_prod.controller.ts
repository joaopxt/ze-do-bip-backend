import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { GuardaProdService } from './guarda_prod.service';
import {
  ListarGuardasProdQueryDto,
  ObterDetalhesProdParamsDto,
  ObterDetalhesProdQueryDto,
  GuardaProdParamsDto,
  GuardaProdBodyDto,
} from './dto/listar-guardas.dto';
import { GuardaProdResponse } from './interfaces/guarda_prod.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

/**
 * Controller para operações de GuardaProd - APENAS LOJA 01 (PECISTA)
 */
@Controller('guardas-prod')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('guarda')
export class GuardaProdController {
  constructor(private readonly guardaProdService: GuardaProdService) {}

  /**
   * Listar todas as guardas disponíveis
   * GET /guardas
   */
  @Get()
  async listarGuardas(@Query() query: ListarGuardasProdQueryDto): Promise<GuardaProdResponse<any>> {
    const { cd_loja = '01', cd_usuario } = query;

    this.validarLoja(cd_loja);

    const guardas = await this.guardaProdService.listarGuardas(cd_usuario);

    return this.buildResponse(guardas, {
      cd_loja: '01',
      cd_usuario: cd_usuario || 'TODOS',
      total: Array.isArray(guardas) ? guardas.length : 0,
    });
  }

  /**
   * Obter detalhes de uma guarda específica
   * GET /guardas/:sq_guarda
   */
  @Get(':sq_guarda')
  async obterDetalhes(
    @Param() params: ObterDetalhesProdParamsDto,
    @Query() query: ObterDetalhesProdQueryDto,
  ): Promise<GuardaProdResponse<any>> {
    const { sq_guarda } = params;
    const { cd_loja = '01' } = query;

    this.validarLoja(cd_loja);
    this.validarSqGuarda(sq_guarda);

    const detalhes = await this.guardaProdService.obterDetalhes(sq_guarda);

    return this.buildResponse(detalhes, {
      sq_guarda,
      cd_loja: '01',
    });
  }

  /**
   * Iniciar uma guarda
   * POST /guardas/:sq_guarda/iniciar
   */
  @Post(':sq_guarda/iniciar')
  async iniciarGuarda(
    @Param() params: GuardaProdParamsDto,
    @Body() body: GuardaProdBodyDto,
  ): Promise<GuardaProdResponse<any>> {
    const { sq_guarda } = params;
    const { cd_loja = '01' } = body;

    this.validarLoja(cd_loja);
    this.validarSqGuarda(sq_guarda);

    const resultado = await this.guardaProdService.iniciarGuarda(sq_guarda);

    return this.buildResponse(resultado, {
      sq_guarda,
      cd_loja: '01',
      action: 'INICIAR_GUARDA',
    });
  }

  /**
   * Finalizar uma guarda
   * POST /guardas/:sq_guarda/finalizar
   */
  @Post(':sq_guarda/finalizar')
  async finalizarGuarda(
    @Param() params: GuardaProdParamsDto,
    @Body() body: GuardaProdBodyDto,
  ): Promise<GuardaProdResponse<any>> {
    const { sq_guarda } = params;
    const { cd_loja = '01' } = body;

    this.validarLoja(cd_loja);
    this.validarSqGuarda(sq_guarda);

    const resultado = await this.guardaProdService.finalizarGuarda(sq_guarda);

    return this.buildResponse(resultado, {
      sq_guarda,
      cd_loja: '01',
      action: 'FINALIZAR_GUARDA',
    });
  }

  /**
   * Testar conectividade com SIAC
   * POST /guardas/test-connection
   */
  @Post('test-connection')
  async testarConectividade(): Promise<GuardaProdResponse<any>> {
    const resultado = await this.guardaProdService.testarConectividade();

    return this.buildResponse(resultado, {
      cd_loja: '01',
      tipo: 'TESTE_CONECTIVIDADE',
    });
  }

  /**
   * Obter informações da loja configurada
   * GET /guardas/info/loja
   */
  @Get('info/loja')
  async obterInfoLoja(): Promise<GuardaProdResponse<any>> {
    const lojaInfo = this.guardaProdService.getLojaInfo();

    return this.buildResponse(lojaInfo, {
      cd_loja: '01',
    });
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  private validarLoja(cdLoja: string): void {
    if (!this.guardaProdService.isLojaValida(cdLoja)) {
      throw new HttpException(
        {
          message: 'Apenas loja 01 (PECISTA) é autorizada',
          code: 'INVALID_STORE_CODE',
          lojaAutorizada: '01',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validarSqGuarda(sqGuarda: string): void {
    if (!sqGuarda) {
      throw new HttpException(
        {
          message: 'Sequencial da guarda é obrigatório',
          code: 'MISSING_SQ_GUARDA',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private buildResponse<T>(data: T, extraMetadata: Record<string, any> = {}): GuardaProdResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        cd_loja: '01',
        regiao: 'DF',
        loja: 'PECISTA',
        timestamp: new Date().toISOString(),
        ...extraMetadata,
      },
    };
  }
}
