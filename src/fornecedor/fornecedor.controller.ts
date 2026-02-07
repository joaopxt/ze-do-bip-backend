import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { FornecedorService } from './fornecedor.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Fornecedor')
@Controller('fornecedor')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FornecedorController {
  constructor(private readonly fornecedorService: FornecedorService) {}

  @Public()
  @ApiOperation({ summary: 'Sync from Postgres' })
  @Post('sync')
  syncFromPostgres() {
    return this.fornecedorService.syncFromPostgres();
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'List all fornecedores' })
  @Get()
  findAll() {
    return this.fornecedorService.findAll();
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'Get a fornecedor by codfor' })
  @Get(':codfor')
  findOne(@Param('codfor') codfor: string) {
    return this.fornecedorService.findOne(codfor);
  }
}
