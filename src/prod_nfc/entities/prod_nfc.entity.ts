import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Compra } from '../../compra/entities/compra.entity';

@Entity()
@Index(['cd_loja', 'numnot', 'serie', 'item'], { unique: true })
export class ProdNfc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 2 })
  cd_loja: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  codfor: string;

  @Column({ type: 'varchar', length: 2 })
  serie: string;

  @Column({ type: 'varchar', length: 6 })
  numnot: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  codpro: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  produto: string;

  @Column({ type: 'int', nullable: true })
  qtde: number;

  @Column({ type: 'int', nullable: true })
  qtdep: number;

  @Column({ type: 'decimal', precision: 22, scale: 4, nullable: true })
  preco: number;

  @Column({ type: 'decimal', precision: 22, scale: 4, nullable: true })
  desconto: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  ipi: number;

  @Column({ type: 'timestamp', nullable: true })
  emissao: Date;

  @Column({ type: 'varchar', length: 1, nullable: true })
  atualiza: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  numped: string;

  @Column({ type: 'decimal', precision: 22, scale: 4, nullable: true })
  p_comant: number;

  @Column({ type: 'varchar', length: 4 })
  item: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  codforoid: string;

  @Column({ type: 'bigint', nullable: true })
  qt_reposic: number;

  @Column()
  idCompra: number;

  @Column({ type: 'boolean', default: false })
  bipado: boolean;

  // Campos de bipagem detalhada
  @Column({ type: 'int', default: 0 })
  qtde_bipada: number;

  @Column({ type: 'timestamp', nullable: true })
  dt_bipagem: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  endereco_confirmado: string;

  @Column({ type: 'int', nullable: true })
  guarda_id: number;

  @ManyToOne(() => Compra, (compra) => compra.produtos)
  @JoinColumn({ name: 'idCompra', referencedColumnName: 'id' })
  compra: Compra;
}
