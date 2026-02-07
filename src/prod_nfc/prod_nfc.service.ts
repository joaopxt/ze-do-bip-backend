import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CreateProdNfcDto } from './dto/create-prod_nfc.dto';
import { UpdateProdNfcDto } from './dto/update-prod_nfc.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ProdNfc } from './entities/prod_nfc.entity';
import { DataSource, Repository } from 'typeorm';
import { Compra } from 'src/compra/entities/compra.entity';

@Injectable()
export class ProdNfcService {
  constructor(
    @InjectRepository(ProdNfc)
    private prodNfcRepository: Repository<ProdNfc>,
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @Optional()
    @InjectDataSource('postgresConnection')
    private postgresDataSource: DataSource,
  ) {}

  // Sincroniza produtos para uma lista de compras (mais eficiente)
  async syncFromPostgres(
    compras: { numnot: string; serie: string }[],
  ): Promise<{ synced: number; errors: number }> {
    if (!this.postgresDataSource) {
      console.warn('Postgres connection not available. Skipping sync.');
      return { synced: 0, errors: 0 };
    }
    if (compras.length === 0) return { synced: 0, errors: 0 };

    // Montar lista de (numnot, serie) para usar no WHERE
    const conditions = compras
      .map((c) => `(numnot = '${c.numnot}' AND serie = '${c.serie}')`)
      .join(' OR ');

    const produtosPostgres = await this.postgresDataSource.query(`
      SELECT cd_loja, codfor, serie, numnot, codpro, produto, qtde, qtdep,
             preco, desconto, ipi, emissao, atualiza, numped, p_comant,
             item, codigo, codforold, qt_reposic
      FROM "D-1".prod_nfc 
      WHERE cd_loja = '01' AND (${conditions})
      ORDER BY emissao DESC
    `);

    let synced = 0,
      errors = 0;

    for (const produto of produtosPostgres) {
      try {
        if (!produto.numnot || !produto.item) {
          errors++;
          continue;
        }

        // Buscar o ID da compra no MySQL
        const compra = await this.compraRepository.findOne({
          where: {
            cd_loja: produto.cd_loja,
            numnot: produto.numnot,
            serie: produto.serie,
          },
        });

        if (compra) {
          produto.idCompra = compra.id;
        }

        await this.prodNfcRepository.upsert(produto, [
          'cd_loja',
          'numnot',
          'serie',
          'item',
        ]);
        synced++;
      } catch (error) {
        console.error(
          'Erro ao sincronizar produto:',
          produto.numnot,
          produto.item,
          error.message,
        );
        errors++;
      }
    }

    return { synced, errors };
  }

  async findAll(): Promise<ProdNfc[]> {
    return this.prodNfcRepository.find();
  }

  async findOne(id: number): Promise<ProdNfc> {
    const produto = await this.prodNfcRepository.findOne({ where: { id } });
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }
    return produto;
  }

  // ==================== MÉTODOS DE BIPAGEM ====================

  /**
   * Marca um produto como bipado com dados completos
   */
  async marcarComoBipado(
    id: number,
    dados: { quantidade: number; endereco: string; guardaId: number },
  ): Promise<ProdNfc> {
    const produto = await this.findOne(id);

    produto.qtde_bipada = dados.quantidade;
    produto.dt_bipagem = new Date();
    produto.endereco_confirmado = dados.endereco;
    produto.guarda_id = dados.guardaId;
    produto.bipado = true;

    return this.prodNfcRepository.save(produto);
  }

  /**
   * Busca produtos por guarda ID
   */
  async findByGuarda(guardaId: number): Promise<ProdNfc[]> {
    return this.prodNfcRepository.find({
      where: { guarda_id: guardaId },
    });
  }

  /**
   * Reseta o status de bipagem de um produto
   */
  async resetarBipagem(id: number): Promise<ProdNfc> {
    const produto = await this.findOne(id);

    produto.qtde_bipada = 0;
    produto.dt_bipagem = null as unknown as Date;
    produto.endereco_confirmado = null as unknown as string;
    produto.guarda_id = null as unknown as number;
    produto.bipado = false;

    return this.prodNfcRepository.save(produto);
  }
}
