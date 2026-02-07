import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Guarda } from '../../guarda/entities/guarda.entity';

@Entity()
@Index(['sq_guarda', 'id_siac'], { unique: true })
export class ProdutosGuarda {
  @PrimaryGeneratedColumn()
  id: number;

  // === Campos do SIAC ===
  @Column({ type: 'varchar', length: 12 })
  id_siac: string; // Ex: "010013250002"

  @Column({ type: 'varchar', length: 6 })
  cd_produto: string;

  @Column({ type: 'varchar', length: 50 })
  no_produto: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cd_fabrica: string;

  @Column({ type: 'simple-array', nullable: true })
  cod_barras: string[]; // Array de códigos de barra

  @Column({ type: 'varchar', length: 20, nullable: true })
  endereco: string; // Ex: "A.40.03.00.10"

  @Column({ type: 'int' })
  quantidade: number;

  // === Campos de Bipagem (copiados de ProdNfc) ===
  @Column({ type: 'boolean', default: false })
  bipado: boolean;

  @Column({ type: 'int', default: 0 })
  qtde_bipada: number;

  @Column({ type: 'timestamp', nullable: true })
  dt_bipagem: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  endereco_confirmado: string;

  // === Relação com Guarda ===
  @Column()
  sq_guarda: number;

  @ManyToOne(() => Guarda, (guarda) => guarda.produtos_guarda)
  @JoinColumn({ name: 'sq_guarda', referencedColumnName: 'sq_guarda' })
  guarda: Guarda;
}
