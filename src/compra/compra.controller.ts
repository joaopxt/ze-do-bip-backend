import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Compra')
@Controller('compra')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompraController {
  constructor(private readonly compraService: CompraService) {}


  @Permissions('guarda')
  @ApiOperation({ summary: 'List all compras' })
  @Get()
  async findAll() {
    return this.compraService.findAll();
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'Get a compra by id' })
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.compraService.findOne(id);
  }
  
  @Public()
  @ApiOperation({ summary: 'Sync from Postgres' })
  @Post('sync')
  async syncFromPostgres() {
    return this.compraService.syncFromPostgres();
  }

  @Public()
  @ApiOperation({ summary: 'Sync produtos from Postgres' })
  @Post('sync-produtos')
  async syncProdutosFromPostgres() {
    return this.compraService.syncProdutosFromPostgres();
  }
}
