import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Fornecedor } from './entities/fornecedor.entity';

@Injectable()
export class FornecedorService {
  constructor(
    @InjectRepository(Fornecedor)
    private fornecedorRepository: Repository<Fornecedor>,
    @Optional()
    @InjectDataSource('postgresConnection')
    private postgresDataSource: DataSource,
  ) {}

  async syncFromPostgres(): Promise<{ synced: number; errors: number }> {
    if (!this.postgresDataSource) {
      console.warn('Postgres connection not available. Skipping sync.');
      return { synced: 0, errors: 0 };
    }
    console.log('Sincronizando fornecedores...');
    const fornecedoresPostgres = await this.postgresDataSource.query(`
      SELECT codfor, fornec, fantasia, cgc, insc, endereco, bairro, cep,
             ddd, telefone, ddd2, telefone2, dddfax, fax, cidade, estado,
             dt_cadast, obs, contato
      FROM "D-1".fornec
      WHERE codfor IS NOT NULL
    `);

    let synced = 0;
    let errors = 0;

    for (const fornecedor of fornecedoresPostgres) {
      try {
        if (!fornecedor.codfor) {
          console.warn('Registro ignorado - codfor nulo:', fornecedor);
          errors++;
          continue;
        }

        await this.fornecedorRepository.upsert(fornecedor, ['codfor']);
        synced++;
      } catch (error) {
        console.error(
          'Erro ao sincronizar fornecedor:',
          fornecedor.codfor,
          error.message,
        );
        errors++;
      }
    }

    return { synced, errors };
  }

  async findAll(): Promise<Fornecedor[]> {
    return this.fornecedorRepository.find();
  }

  async findOne(codfor: string): Promise<Fornecedor> {
    const fornecedor = await this.fornecedorRepository.findOne({
      where: { codfor },
    });
    if (!fornecedor) {
      throw new NotFoundException('Fornecedor nao encontrado');
    }
    return fornecedor;
  }
}
