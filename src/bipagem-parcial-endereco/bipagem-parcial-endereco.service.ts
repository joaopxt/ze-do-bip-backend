import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BipagemParcialEndereco } from './entities/bipagem-parcial-endereco.entity';
import { CreateBipagemParcialEnderecoDto } from './dto/create-bipagem-parcial-endereco.dto';

@Injectable()
export class BipagemParcialEnderecoService {
  private readonly logger = new Logger(BipagemParcialEnderecoService.name);

  constructor(
    @InjectRepository(BipagemParcialEndereco)
    private readonly bipagemParcialRepository: Repository<BipagemParcialEndereco>,
  ) {}

  /**
   * Cria uma nova confirmação de endereço
   */
  async criarConfirmacao(
    dto: CreateBipagemParcialEnderecoDto,
  ): Promise<BipagemParcialEndereco> {
    this.logger.log(
      `[CRIAR_CONFIRMACAO] Criando confirmação para produto_guarda_id=${dto.produto_guarda_id}`,
      { dto },
    );

    const confirmacao = this.bipagemParcialRepository.create({
      produto_guarda_id: dto.produto_guarda_id,
      endereco: dto.endereco,
      qtde_bipada: dto.qtde_bipada,
      dt_confirmacao: new Date(),
    });

    const resultado = await this.bipagemParcialRepository.save(confirmacao);
    this.logger.log(`[CRIAR_CONFIRMACAO] Confirmação criada com sucesso`, {
      id: resultado.id,
    });

    return resultado;
  }

  /**
   * Busca todas as confirmações de um produto
   */
  async buscarPorProdutoGuarda(
    produtoGuardaId: number,
  ): Promise<BipagemParcialEndereco[]> {
    return this.bipagemParcialRepository.find({
      where: { produto_guarda_id: produtoGuardaId },
      order: { dt_confirmacao: 'ASC' },
    });
  }

  /**
   * Calcula a soma total de quantidade bipada por produtoGuardaId
   */
  async calcularTotalBipadaPorProdutoGuarda(
    produtoGuardaId: number,
  ): Promise<number> {
    const resultado = await this.bipagemParcialRepository
      .createQueryBuilder('bpe')
      .select('SUM(bpe.qtde_bipada)', 'total')
      .where('bpe.produto_guarda_id = :produtoGuardaId', {
        produtoGuardaId,
      })
      .getRawOne();
    return parseInt(resultado?.total || '0', 10);
  }
}
