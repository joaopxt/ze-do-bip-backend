import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Fornecedor {
  @PrimaryColumn({ type: 'varchar', length: 5 })
  codfor: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  fornec: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  fantasia: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  cgc: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  insc: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  endereco: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bairro: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  cep: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  ddd: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  telefone: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  ddd2: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  telefone2: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  dddfax: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  fax: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cidade: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  estado: string;

  @Column({ type: 'date', nullable: true })
  dt_cadast: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  obs: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  contato: string;
}
