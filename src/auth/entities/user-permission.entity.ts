import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity('user_permissions')
@Index(['codoper', 'permission_id'], { unique: true }) // Evita duplicação
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 5 })
  codoper: string; // FK para tpd013.codoper (cd_usuario)

  @Column()
  permission_id: number;

  @ManyToOne(() => Permission, (permission) => permission.userPermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @Column({ type: 'boolean', default: true })
  granted: boolean; // true = acesso concedido, false = acesso negado

  @CreateDateColumn()
  created_at: Date;
}
