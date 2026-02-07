import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProdutosGuardaService } from './produtos_guarda.service';
import { CreateProdutosGuardaDto } from './dto/create-produtos_guarda.dto';
import { UpdateProdutosGuardaDto } from './dto/update-produtos_guarda.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('produtos-guarda')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('guarda')
export class ProdutosGuardaController {
  constructor(private readonly produtosGuardaService: ProdutosGuardaService) {}

  @Post()
  create(@Body() createProdutosGuardaDto: CreateProdutosGuardaDto) {
    return this.produtosGuardaService.create(createProdutosGuardaDto);
  }

  @Get()
  findAll() {
    return this.produtosGuardaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produtosGuardaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProdutosGuardaDto: UpdateProdutosGuardaDto) {
    return this.produtosGuardaService.update(+id, updateProdutosGuardaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.produtosGuardaService.remove(+id);
  }
}
