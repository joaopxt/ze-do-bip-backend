import { Injectable, Optional } from '@nestjs/common';
import { CreateEstoquistaDto } from './dto/create-estoquista.dto';
import { UpdateEstoquistaDto } from './dto/update-estoquista.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Estoquista } from './entities/estoquista.entity';

@Injectable()
export class EstoquistaService {
  constructor(
    @Optional()
    @InjectDataSource('postgresConnection')
    private postgresDataSource: DataSource,
    @InjectRepository(Estoquista)
    private estoquistaRepository: Repository<Estoquista>,
  ) {}

  async syncFromPostgres() {
    if (!this.postgresDataSource) {
      console.warn('Postgres connection not available. Skipping sync.');
      return { synced: 0, errors: 0 };
    }

    const usuariosPostgres = await this.postgresDataSource.query(`
      SELECT * FROM "H-1".tpd013;
      `);

    const estoquistas = usuariosPostgres
      .filter(
        (usuario) =>
          usuario.codgru == '0030' ||
          usuario.codgru == '0010' ||
          usuario.codgru == '0023' ||
          usuario.codgru == '0008',
      )
      .map((usuario) => ({
        codoper: usuario.codoper,
        nome: usuario.operador,
        grupo: usuario.codgru,
      }));

    let synced = 0;
    let errors = 0;

    for (const estoquista of estoquistas) {
      try {
        // Validar campos obrigatorios
        if (!estoquista.codoper) {
          console.warn(
            'Registro ignorado - campos obrigatorios nulos:',
            estoquista,
          );
          errors++;
          continue;
        }

        await this.estoquistaRepository.upsert(estoquista, ['codoper']);
        synced++;
      } catch (error) {
        console.error(
          'Erro ao sincronizar estoquista:',
          estoquista.codoper,
          error.message,
        );
        errors++;
      }
    }

    return { synced, errors };
  }
}
