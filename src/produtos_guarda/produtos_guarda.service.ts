import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProdutosGuardaDto } from './dto/create-produtos_guarda.dto';
import { UpdateProdutosGuardaDto } from './dto/update-produtos_guarda.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Produto } from 'src/produtos/entities/produto.entity';
import { Repository } from 'typeorm';
import { Guarda } from 'src/guarda/entities/guarda.entity';
import { PrdLoja } from 'src/prd_loja/entities/prd_loja.entity';
import { ProdutosGuarda } from './entities/produtos_guarda.entity';

@Injectable()
export class ProdutosGuardaService {
  constructor(
    @InjectRepository(ProdutosGuarda)
    private readonly produtosGuardaRepository: Repository<ProdutosGuarda>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Guarda)
    private readonly guardaRepository: Repository<Guarda>,
    @InjectRepository(PrdLoja)
    private readonly prdLojaRepository: Repository<PrdLoja>,
  ) {}

  async create(createProdutosGuardaDto: CreateProdutosGuardaDto) {
    const produto = await this.produtoRepository.findOne({
      where: { codpro: createProdutosGuardaDto.cd_produto },
    });

    if (!produto) {
      throw new NotFoundException('Produto nao encontrado');
    }

    const guarda = await this.guardaRepository.findOne({
      where: { sq_guarda: createProdutosGuardaDto.sq_guarda },
    });

    if (!guarda) {
      throw new NotFoundException('Guarda nao encontrada');
    }

    const endereco = await this.prdLojaRepository.findOne({
      where: {
        codpro: createProdutosGuardaDto.cd_produto,
        cd_loja: guarda.cd_loja,
      },
    });

    if (!endereco) {
      throw new NotFoundException('Endereco nao encontrado');
    }

    const produtosGuarda = await this.produtosGuardaRepository.create({
      id_siac:
        '01' +
        createProdutosGuardaDto.cd_produto.padStart(6, '0') +
        String(Date.now()).slice(-4),
      cd_produto: createProdutosGuardaDto.cd_produto,
      no_produto: produto.produto,
      cd_fabrica: produto.num_fab,
      cod_barras: [produto.cod_barra],
      endereco: endereco.localiza,
      quantidade: createProdutosGuardaDto.quantidade,
      sq_guarda: guarda.sq_guarda,
      bipado: false,
      qtde_bipada: 0,
    });

    return await this.produtosGuardaRepository.save(produtosGuarda);
  }

  findAll() {
    return `This action returns all produtosGuarda`;
  }

  findOne(id: number) {
    return `This action returns a #${id} produtosGuarda`;
  }

  update(id: number, updateProdutosGuardaDto: UpdateProdutosGuardaDto) {
    return `This action updates a #${id} produtosGuarda`;
  }

  remove(id: number) {
    return `This action removes a #${id} produtosGuarda`;
  }
}
