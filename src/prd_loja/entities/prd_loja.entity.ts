import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity()
@Index(['cd_loja', 'codpro'], { unique: true })
export class PrdLoja {
  @PrimaryColumn({ type: 'varchar', length: 2 })
  cd_loja: string;

  @PrimaryColumn({ type: 'varchar', length: 6 })
  codpro: string;

  @Column({ type: 'varchar', length: 9, nullable: true })
  localiza: string;

  @Column({ type: 'varchar', length: 9, nullable: true })
  localiza2: string;
}
