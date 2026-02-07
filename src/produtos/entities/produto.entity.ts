import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Produto {
  @PrimaryColumn({ type: 'varchar', length: 6 })
  codpro: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  produto: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  aplicacao: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  unidade: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  codfor: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  codgru: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  codsubgru: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  codsec: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  num_fab: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  num_orig: string;

  @Column({ type: 'date', nullable: true })
  cadastro: Date;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cod_barra: string;
}
