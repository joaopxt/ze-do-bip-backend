import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('user_roles')
@Index(['codoper'], { unique: true }) // Um usuário só pode ter uma role
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 5 })
  codoper: string; // FK para tpd013.codoper (cd_usuario)

  @Column()
  role_id: number;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn()
  created_at: Date;
}
