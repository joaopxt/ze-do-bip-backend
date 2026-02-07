import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { EntregaOrdem } from './entrega-ordem.entity';

@Entity('entrega_volume')
export class EntregaVolume {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  ordem_id: string;

  @Column({ type: 'varchar', length: 50 })
  codigo_barras: string;

  @Column({ type: 'varchar', length: 200 })
  descricao: string;

  @Column({ type: 'int', default: 1 })
  quantidade: number;

  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  status: string; // pendente | entregue | extraviado

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_bipagem: Date | null;

  @ManyToOne(() => EntregaOrdem, (ordem) => ordem.volumes)
  @JoinColumn({ name: 'ordem_id' })
  ordem: EntregaOrdem;
}
