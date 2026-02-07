import {
  Controller,
  Get,
  Post,
  Param,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AlterarEnderecoDto } from './dto/alterar-endereco.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

interface ProdutoResponse {
  cd_produto: string;
  no_produto: string;
  cd_fabrica: string;
  endereco: string;
  qt_estoque: number;
  situacao: string;
  cod_barras: string[];
}

@ApiTags('Produtos')
@Controller('produtos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Public()
  @ApiOperation({ summary: 'Sync from Postgres' })
  @Post('sync')
  syncFromPostgres() {
    return this.produtosService.syncFromPostgres();
  }

  @Permissions('enderecamento')
  @ApiOperation({ summary: 'Alterar endereço do produto' })
  @ApiBody({ type: AlterarEnderecoDto })
  @Put('alterar-endereco/:codpro')
  async alterarEndereco(
    @Param('codpro') codpro: string,
    @Body() alterarEnderecoDto: AlterarEnderecoDto,
  ) {
    return this.produtosService.alterarEndereco(
      codpro,
      alterarEnderecoDto.enderecoNovo,
    );
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'List all produtos' })
  @Get()
  findAll() {
    return this.produtosService.findAll();
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'Get a produto by codpro' })
  @Get(':codpro')
  findOne(@Param('codpro') codpro: string) {
    return this.produtosService.findOne(codpro);
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'Get a produto by cod_barra' })
  @Get('get-by-barra/:cod_barra')
  findByCodBarra(
    @Param('cod_barra') cod_barra: string,
  ): Promise<ProdutoResponse> {
    return this.produtosService.findByCodBarra(cod_barra);
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'Get endereco by id' })
  @Get('get-endereco/:id/:codpro')
  findEnderecoById(@Param('id') id: number, @Param('codpro') codpro: string) {
    return this.produtosService.findEnderecoById(id, codpro);
  }

  @Permissions('guarda')
  @ApiOperation({ summary: 'Incrementar quantidade bipada de um produto' })
  @Post(':cd_produto/bipar')
  async bipar(
    @Param('cd_produto') cd_produto: string,
    @Body() body: { incremento: number; endereco: string; sq_guarda: number },
  ) {
    return this.produtosService.bipar(
      cd_produto,
      body.sq_guarda,
      body.incremento,
      body.endereco,
    );
  }
}
