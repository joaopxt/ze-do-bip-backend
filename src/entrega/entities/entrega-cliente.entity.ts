import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { EntregaRota } from './entrega-rota.entity';
import { EntregaOrdem } from './entrega-ordem.entity';

@Entity('entrega_cliente')
export class EntregaCliente {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  rota_id: string;

  @Column({ type: 'varchar', length: 150 })
  nome_comercial: string;

  @Column({ type: 'varchar', length: 200 })
  nome_formal: string;

  @Column({ type: 'varchar', length: 300 })
  endereco: string;

  @Column({ type: 'varchar', length: 100 })
  cidade: string;

  @Column({ type: 'int' })
  ordem_na_rota: number;

  @Column({ type: 'int', default: 0 })
  total_ordens: number;

  @Column({ type: 'int', default: 0 })
  ordens_finalizadas: number;

  @Column({ type: 'varchar', length: 20, default: 'aguardando' })
  status: string; // aguardando | em_andamento | finalizado | bloqueado

  @Column({ type: 'timestamp', nullable: true })
  dt_inicio: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_fim: Date | null;

  @ManyToOne(() => EntregaRota, (rota) => rota.clientes)
  @JoinColumn({ name: 'rota_id' })
  rota: EntregaRota;

  @OneToMany(() => EntregaOrdem, (ordem) => ordem.cliente)
  ordens: EntregaOrdem[];
}
