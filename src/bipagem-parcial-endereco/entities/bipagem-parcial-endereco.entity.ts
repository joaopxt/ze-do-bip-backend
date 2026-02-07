import { ProdutosGuarda } from 'src/produtos_guarda/entities/produtos_guarda.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('bipagem_parcial_endereco')
@Index(['produto_guarda_id', 'dt_confirmacao'])
export class BipagemParcialEndereco {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  produto_guarda_id: number;

  @ManyToOne(() => ProdutosGuarda)
  @JoinColumn({ name: 'produto_guarda_id' })
  produto_guarda: ProdutosGuarda;

  @Column({ type: 'varchar', length: 50 })
  endereco: string;

  @Column({ type: 'int' })
  qtde_bipada: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dt_confirmacao: Date;
}
