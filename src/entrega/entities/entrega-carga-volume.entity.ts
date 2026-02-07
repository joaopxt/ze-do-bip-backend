import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { EntregaCarga } from './entrega-carga.entity';

@Entity('entrega_carga_volume')
export class EntregaCargaVolume {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  carga_id: string;

  @Column({ type: 'varchar', length: 36 })
  volume_id: string;

  @Column({ type: 'varchar', length: 50 })
  codigo_barras: string;

  @Column({ type: 'varchar', length: 200 })
  descricao: string;

  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  status: string; // pendente | bipado

  @Column({ type: 'timestamp', nullable: true })
  dt_bipagem: Date | null;

  @ManyToOne(() => EntregaCarga, (carga) => carga.carga_volumes)
  @JoinColumn({ name: 'carga_id' })
  carga: EntregaCarga;
}
