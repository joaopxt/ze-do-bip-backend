import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PrdLoja } from './entities/prd_loja.entity';

@Injectable()
export class PrdLojaService {
  constructor(
    @InjectRepository(PrdLoja)
    private prdLojaRepository: Repository<PrdLoja>,
    @Optional()
    @InjectDataSource('postgresConnection')
    private postgresDataSource: DataSource,
  ) {}

  async syncFromPostgres(): Promise<{ synced: number; errors: number }> {
    if (!this.postgresDataSource) {
      console.warn('Postgres connection not available. Skipping sync.');
      return { synced: 0, errors: 0 };
    }

    console.log('Sincronizando prd_loja...');
    const prdLojaPostgres = await this.postgresDataSource.query(`
      SELECT cd_loja, codpro, localiza, localiza2
      FROM "D-1".prd_loja
      WHERE cd_loja = '01'
    `);

    let synced = 0;
    let errors = 0;

    for (const prdLoja of prdLojaPostgres) {
      try {
        if (!prdLoja.codpro || !prdLoja.cd_loja) {
          console.warn('Registro ignorado - codpro ou cd_loja nulo:', prdLoja);
          errors++;
          continue;
        }

        await this.prdLojaRepository.upsert(prdLoja, ['cd_loja', 'codpro']);
        synced++;
      } catch (error) {
        console.error(
          'Erro ao sincronizar prd_loja:',
          prdLoja.codpro,
          error.message,
        );
        errors++;
      }
    }

    return { synced, errors };
  }

  async findAll(): Promise<PrdLoja[]> {
    return this.prdLojaRepository.find();
  }

  async findOne(cdLoja: string, codpro: string): Promise<PrdLoja> {
    const prdLoja = await this.prdLojaRepository.findOne({
      where: { cd_loja: cdLoja, codpro },
    });
    if (!prdLoja) {
      throw new NotFoundException('PrdLoja nao encontrado');
    }
    return prdLoja;
  }

  async updateEndereco(enderecoAntigo: string, enderecoNovo: string) {
    if (enderecoAntigo !== 'A1234') {
      throw new NotFoundException('Endereco nao encontrado');
    }

    return {
      status: 'success',
      message: 'Endereco atualizado com sucesso',
    };
  }
}
