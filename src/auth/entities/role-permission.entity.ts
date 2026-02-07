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
import { Permission } from './permission.entity';

@Entity('role_permissions')
@Index(['role_id', 'permission_id'], { unique: true }) // Evita duplicação
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role_id: number;

  @Column()
  permission_id: number;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn()
  created_at: Date;
}
