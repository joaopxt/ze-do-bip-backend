import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProdNfcService } from './prod_nfc.service';
import { CreateProdNfcDto } from './dto/create-prod_nfc.dto';
import { UpdateProdNfcDto } from './dto/update-prod_nfc.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('ProdNfc')
@Controller('prod-nfc')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('guarda')
export class ProdNfcController {
  constructor(private readonly prodNfcService: ProdNfcService) {}

  @ApiOperation({ summary: 'List all prod_nfc' })
  @Get()
  async findAll() {
    return this.prodNfcService.findAll();
  }

  // IMPORTANTE: Rota específica deve vir ANTES da rota genérica :id
  // GET /prod-nfc/guarda/:guardaId - Buscar produtos por guarda
  @ApiOperation({ summary: 'List products by guarda' })
  @Get('guarda/:guardaId')
  async findByGuarda(@Param('guardaId') guardaId: number) {
    return this.prodNfcService.findByGuarda(guardaId);
  }

  @ApiOperation({ summary: 'Get a prod_nfc by id' })
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.prodNfcService.findOne(id);
  }

  // POST /prod-nfc/:id/bipar - Marcar produto como bipado com dados
  @ApiOperation({ summary: 'Mark product as bipado in prod_nfc' })
  @Post(':id/bipar')
  async marcarComoBipado(
    @Param('id') id: number,
    @Body() body: { quantidade: number; endereco: string; guardaId: number }
  ) {
    return this.prodNfcService.marcarComoBipado(id, body);
  }

  // POST /prod-nfc/:id/resetar - Resetar bipagem
  @ApiOperation({ summary: 'Reset bipagem' })
  @Post(':id/resetar')
  async resetarBipagem(@Param('id') id: number) {
    return this.prodNfcService.resetarBipagem(id);
  }
}
