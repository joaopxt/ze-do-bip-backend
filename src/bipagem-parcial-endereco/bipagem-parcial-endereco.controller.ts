import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BipagemParcialEnderecoService } from './bipagem-parcial-endereco.service';
import { CreateBipagemParcialEnderecoDto } from './dto/create-bipagem-parcial-endereco.dto';
import { UpdateBipagemParcialEnderecoDto } from './dto/update-bipagem-parcial-endereco.dto';

@Controller('bipagem-parcial-endereco')
export class BipagemParcialEnderecoController {
  constructor(
    private readonly bipagemParcialEnderecoService: BipagemParcialEnderecoService,
  ) {}

  @Post()
  criarConfirmacao(
    @Body() createBipagemParcialEnderecoDto: CreateBipagemParcialEnderecoDto,
  ) {
    return this.bipagemParcialEnderecoService.criarConfirmacao(
      createBipagemParcialEnderecoDto,
    );
  }

  @Get(':id')
  buscarPorProdutoGuarda(@Param('produtoGuardaId') produtoGuardaId: number) {
    return this.bipagemParcialEnderecoService.buscarPorProdutoGuarda(
      +produtoGuardaId,
    );
  }

  @Get('total-bipada/:produtoGuardaId')
  calcularTotalBipadaPorProdutoGuarda(
    @Param('produtoGuardaId') produtoGuardaId: number,
  ) {
    return this.bipagemParcialEnderecoService.calcularTotalBipadaPorProdutoGuarda(
      +produtoGuardaId,
    );
  }
}
