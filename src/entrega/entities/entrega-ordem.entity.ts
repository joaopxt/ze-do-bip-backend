import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { EntregaCliente } from './entrega-cliente.entity';
import { EntregaVolume } from './entrega-volume.entity';

@Entity('entrega_ordem')
export class EntregaOrdem {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  cliente_id: string;

  @Column({ type: 'varchar', length: 10 })
  tipo: string; // DESCARGA | COLETA

  @Column({ type: 'varchar', length: 20 })
  numero_nota: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  serie: string | null;

  @Column({ type: 'int', default: 0 })
  total_volumes: number;

  @Column({ type: 'int', default: 0 })
  volumes_resolvidos: number;

  @Column({ type: 'varchar', length: 20, default: 'aguardando' })
  status: string; // aguardando | em_andamento | finalizada

  @Column({ type: 'timestamp', nullable: true })
  dt_inicio: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_fim: Date | null;

  @ManyToOne(() => EntregaCliente, (cliente) => cliente.ordens)
  @JoinColumn({ name: 'cliente_id' })
  cliente: EntregaCliente;

  @OneToMany(() => EntregaVolume, (volume) => volume.ordem)
  volumes: EntregaVolume[];
}
