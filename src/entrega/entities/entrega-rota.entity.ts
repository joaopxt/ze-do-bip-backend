import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { EntregaCarga } from './entrega-carga.entity';
import { EntregaCliente } from './entrega-cliente.entity';

@Entity('entrega_rota')
export class EntregaRota {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  motorista_id: string;

  @Column({ type: 'varchar', length: 100 })
  motorista_nome: string;

  @Column({ type: 'varchar', length: 20 })
  placa_veiculo: string;

  @Column({ type: 'boolean', default: false })
  ordem_editavel: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dt_sync_down: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dt_sync_up: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  status: string; // pendente | em_carga | em_rota | finalizada

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => EntregaCarga, (carga) => carga.rota)
  carga: EntregaCarga;

  @OneToMany(() => EntregaCliente, (cliente) => cliente.rota)
  clientes: EntregaCliente[];
}
