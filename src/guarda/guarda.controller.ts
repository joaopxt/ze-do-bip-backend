import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GuardaService } from './guarda.service';
import { GuardaSyncService } from './guarda-sync.service';
import {
  CreateGuardaDto,
  CreateGuardaSeederDto,
} from './dto/create-guarda.dto';
import { UpdateGuardaDto } from './dto/update-guarda.dto';
import { Compra } from 'src/compra/entities/compra.entity';
import { Estoquista } from 'src/estoquista/entities/estoquista.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('Guarda')
@Controller('guardas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('guarda')
export class GuardaController {
  constructor(
    private readonly guardaService: GuardaService,
    private readonly guardaSyncService: GuardaSyncService,
  ) {}

  // POST /guardas/sync-siac - Sincronizar guardas do SIAC manualmente
  @ApiOperation({ summary: 'Sincronizar guardas do SIAC manualmente' })
  @Post('sync-siac')
  syncFromSiac() {
    return this.guardaSyncService.syncFromSiac();
  }

  @ApiOperation({ summary: 'Create a guarda' })
  @Post('create')
  create(@Body() body: { createGuardaSeederDto: CreateGuardaSeederDto }) {
    return this.guardaService.createGuarda(body.createGuardaSeederDto);
  }

  // GET /guardas?cd_usuario=XXX - Listar guardas por usuário
  @ApiOperation({ summary: 'List guardas by user' })
  @Get()
  findAll(@Query('cd_usuario') cdUsuario?: string) {
    return this.guardaService.findAllByUser(cdUsuario);
  }

  // GET /guardas/prod/:sq_guarda - Detalhes de uma guarda com produtos (ambiente de teste)
  @ApiOperation({ summary: 'Get a guarda details (test path /prod)' })
  @Get('prod/:sq_guarda')
  findOneTestPath(@Param('sq_guarda') sqGuarda: number) {
    return this.guardaService.findOne(sqGuarda);
  }

  // GET /guardas/:sq_guarda - Detalhes de uma guarda com produtos (path padrão)
  @ApiOperation({ summary: 'Get a guarda details' })
  @Get(':sq_guarda')
  findOne(@Param('sq_guarda') sqGuarda: number) {
    return this.guardaService.findOne(sqGuarda);
  }

  // POST /guardas/:sq_guarda/iniciar
  @ApiOperation({ summary: 'Start a guarda' })
  @Post(':sq_guarda/iniciar')
  iniciar(@Param('sq_guarda') sqGuarda: number) {
    return this.guardaService.iniciar(sqGuarda);
  }

  // POST /guardas/:sq_guarda/finalizar
  @ApiOperation({ summary: 'Finish a guarda' })
  @Post(':sq_guarda/finalizar')
  finalizar(@Param('sq_guarda') sqGuarda: number) {
    return this.guardaService.finalizar(sqGuarda);
  }

  // POST /guardas/produtos/:id/bipar - Marcar produto como bipado
  @ApiOperation({ summary: 'Mark product as bipado' })
  @Post('produtos/:id/bipar')
  marcarBipado(
    @Param('id') id: number,
    @Body()
    body?: { quantidade?: number; endereco?: string; guardaId?: number },
  ) {
    return this.guardaService.marcarBipado(id, body);
  }

  // POST /guardas/:sq_guarda/desbipar-todos - Desbipar todos os produtos da guarda
  @ApiOperation({ summary: 'Unmark all products in guarda' })
  @Post(':sq_guarda/desbipar-todos')
  desbiparTodos(@Param('sq_guarda') sqGuarda: number) {
    return this.guardaService.desbiparTodos(sqGuarda);
  }

  // GET /guardas/:sq_guarda/contagem-bipados - Retornar contagem de produtos bipados e não bipados
  @ApiOperation({ summary: 'Get bipados count' })
  @Get(':sq_guarda/contagem-bipados')
  getContagemBipados(@Param('sq_guarda') sqGuarda: number) {
    return this.guardaService.getContagemBipados(sqGuarda);
  }

  // GET /guardas/:sq_guarda/produtos - Buscar produtos de uma guarda específica
  @ApiOperation({ summary: 'Get products by guarda' })
  @Get(':sq_guarda/produtos')
  buscarProdutosPorGuarda(@Param('sq_guarda') sqGuarda: number) {
    return this.guardaService.buscarProdutosPorGuarda(sqGuarda);
  }

  // POST /guardas/produtos/:id/resetar - Resetar bipagem de um produto
  @ApiOperation({ summary: 'Reset product bipagem' })
  @Post('produtos/:id/resetar')
  resetarBipagem(@Param('id') id: number) {
    return this.guardaService.resetarBipagem(id);
  }
}
