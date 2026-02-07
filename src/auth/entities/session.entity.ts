import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string; // ID único da sessão (usado como jti no JWT)

  @Column()
  @Index()
  cd_usuario: string; // Usuário dono da sessão

  @Column({ nullable: true })
  device_info: string; // Info do dispositivo (opcional)

  @Column({ nullable: true })
  ip_address: string; // IP de origem

  @Column({ default: true })
  @Index()
  is_active: boolean; // Se a sessão está ativa

  @Column()
  expires_at: Date; // Data de expiração

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
