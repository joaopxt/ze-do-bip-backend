import { Guarda } from 'src/guarda/entities/guarda.entity';
import { ProdNfc } from 'src/prod_nfc/entities/prod_nfc.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
@Index(['cd_loja', 'numnot', 'serie'], { unique: true })
export class Compra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 2 })
  cd_loja: string;

  @Column({ type: 'varchar', length: 6 })
  numnot: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  serie: string;

  @Column({ type: 'timestamp', nullable: true })
  emissao: Date;

  @Column({ type: 'timestamp', nullable: true })
  cadastro: Date;

  @Column({ type: 'varchar', length: 5, nullable: true })
  codfor: string;

  @Column({ type: 'varchar', length: 55, nullable: true })
  obs: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  obs2: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  in_chegou: string;

  @Column({ type: 'timestamp', nullable: true })
  dt_chegou: Date;

  @Column({ type: 'varchar', length: 8, nullable: true })
  hr_cadastr: string;

  @Column({ type: 'decimal', precision: 17, scale: 2, nullable: true })
  valortot: number;

  @Column({ type: 'decimal', precision: 17, scale: 2, nullable: true })
  valorcom: number;

  @OneToMany(() => ProdNfc, (produto) => produto.compra)
  produtos: ProdNfc[];

  @ManyToOne(() => Guarda, (guarda) => guarda.compra)
  @JoinColumn({ referencedColumnName: 'sq_guarda' })
  guarda: Guarda;
}
