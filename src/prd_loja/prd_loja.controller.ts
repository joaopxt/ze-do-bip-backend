import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PrdLojaService } from './prd_loja.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('PrdLoja')
@Controller('prd-loja')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PrdLojaController {
  constructor(private readonly prdLojaService: PrdLojaService) {}

  @Public()
  @ApiOperation({ summary: 'Sync from Postgres' })
  @Post('sync')
  syncFromPostgres() {
    return this.prdLojaService.syncFromPostgres();
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'List all prd_loja' })
  @Get()
  findAll() {
    return this.prdLojaService.findAll();
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'Get a prd_loja by cdLoja and codpro' })
  @Get(':cdLoja/:codpro')
  findOne(@Param('cdLoja') cdLoja: string, @Param('codpro') codpro: string) {
    return this.prdLojaService.findOne(cdLoja, codpro);
  }

  @Permissions('enderecamento')
  @ApiOperation({ summary: 'Update a product address' })
  @Post('update-endereco')
  updateEndereco(@Body() body: any) {
    return this.prdLojaService.updateEndereco(
      body.enderecoAntigo,
      body.enderecoNovo,
    );
  }
}
