import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { EntregaRota } from './entrega-rota.entity';
import { EntregaCargaVolume } from './entrega-carga-volume.entity';

@Entity('entrega_carga')
export class EntregaCarga {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  rota_id: string;

  @Column({ type: 'int', default: 0 })
  total_volumes: number;

  @Column({ type: 'int', default: 0 })
  volumes_bipados: number;

  @Column({ type: 'int', default: 0 })
  volumes_pendentes: number;

  @Column({ type: 'varchar', length: 20, default: 'aguardando' })
  status: string; // aguardando | em_andamento | finalizada

  @Column({ type: 'timestamp', nullable: true })
  dt_inicio: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_fim: Date | null;

  @OneToOne(() => EntregaRota, (rota) => rota.carga)
  @JoinColumn({ name: 'rota_id' })
  rota: EntregaRota;

  @OneToMany(() => EntregaCargaVolume, (cv) => cv.carga)
  carga_volumes: EntregaCargaVolume[];
}
