import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EntregaService } from './entrega.service';
import { SyncDownDto } from './dto/sync-down.dto';
import { SyncUpDto } from './dto/sync-up.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Entrega')
@Controller('entrega')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('entrega')
@ApiBearerAuth()
export class EntregaController {
  private readonly logger = new Logger(EntregaController.name);

  constructor(private readonly entregaService: EntregaService) {}

  // GET /entrega/health — Health check (público)
  @Public()
  @ApiOperation({ summary: 'Health check do módulo entrega' })
  @Get('health')
  async health() {
    return {
      success: true,
      data: {
        status: 'online',
        timestamp: new Date().toISOString(),
        modulo: 'entrega',
      },
    };
  }

  // POST /entrega/sync-down — Monta payload completo para o motorista
  @ApiOperation({ summary: 'Sync Down - Baixar rota completa para o dispositivo' })
  @Post('sync-down')
  @HttpCode(HttpStatus.OK)
  async syncDown(@Body() dto: SyncDownDto) {
    this.logger.log(`[SYNC-DOWN] motorista_id=${dto.motorista_id}`);
    const payload = await this.entregaService.syncDown(dto.motorista_id);
    return {
      success: true,
      data: payload,
    };
  }

  // POST /entrega/sync-up — Recebe resultado da rota do dispositivo
  @ApiOperation({ summary: 'Sync Up - Enviar resultados da rota ao servidor' })
  @Post('sync-up')
  @HttpCode(HttpStatus.OK)
  async syncUp(@Body() dto: SyncUpDto) {
    this.logger.log(`[SYNC-UP] rota_id=${dto.rota_id}, motorista_id=${dto.motorista_id}`);
    await this.entregaService.syncUp(dto);
    return {
      success: true,
      message: 'Sync Up processado com sucesso',
    };
  }

  // GET /entrega/rotas — Lista rotas disponíveis (pendentes)
  @ApiOperation({ summary: 'Listar rotas disponíveis para entrega' })
  @Get('rotas')
  async listarRotas() {
    const rotas = await this.entregaService.listarRotasDisponiveis();
    return {
      success: true,
      data: rotas,
      total: rotas.length,
    };
  }

  // GET /entrega/rota-disponivel?motorista_id=xxx — Verifica se motorista tem rota
  @ApiOperation({ summary: 'Verificar se motorista tem rota disponível' })
  @Get('rota-disponivel')
  async verificarRotaDisponivel(@Query('motorista_id') motoristaId: string) {
    const disponivel = await this.entregaService.verificarRotaDisponivel(motoristaId);
    return disponivel;
  }
}
