import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Compra } from './entities/compra.entity';
import { DataSource, Repository } from 'typeorm';
import { ProdNfcService } from 'src/prod_nfc/prod_nfc.service';

@Injectable()
export class CompraService {
  
  constructor(
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    @Optional()
    @InjectDataSource('postgresConnection')
    private postgresDataSource: DataSource,
    private prodNfcService: ProdNfcService,
  ) {}

  async syncFromPostgres(): Promise<{ synced: number; errors: number }> {
    if (!this.postgresDataSource) {
        console.warn('Postgres connection not available. Skipping sync.');
        return { synced: 0, errors: 0 };
    }
    const comprasPostgres = await this.postgresDataSource.query(`
      SELECT cd_loja, numnot, serie, emissao, cadastro, codfor,
             obs, obs2, in_chegou, dt_chegou, hr_cadastr,
             valortot, valorcom
      FROM "H-1".compra 
      WHERE in_chegou = 'S' AND cd_loja = '01' 
        AND numnot IS NOT NULL
      ORDER BY emissao DESC LIMIT 1000
    `);
    
    let synced = 0;
    let errors = 0;
    
    for (const compra of comprasPostgres) {
      try {
        // Validar campos obrigatorios
        if (!compra.numnot || !compra.cd_loja) {
          console.warn('Registro ignorado - campos obrigatorios nulos:', compra);
          errors++;
          continue;
        }
        
        await this.compraRepository.upsert(compra, ['cd_loja', 'numnot', 'serie']);
        synced++;
      } catch (error) {
        console.error('Erro ao sincronizar compra:', compra.numnot, error.message);
        errors++;
      }
    }
    
    return { synced, errors };
  }

  async findAll(): Promise<Compra[]> {
    return this.compraRepository.find({ relations: ['produtos'] });
  }

  async findOne(id: number): Promise<Compra> {
    const compra = await this.compraRepository.findOne({ where: { id }, relations: ['produtos'] });
    if (!compra) {
      throw new NotFoundException('Compra não encontrada');
    }
    return compra;
  }

  async syncProdutosFromPostgres(){
    const compras = await this.compraRepository.find();
    const comprasArray = compras.map(compra => ({ numnot: compra.numnot, serie: compra.serie }));
    const produtos = await this.prodNfcService.syncFromPostgres(comprasArray);
    return produtos;
  }
}