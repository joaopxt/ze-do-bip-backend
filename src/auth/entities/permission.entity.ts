import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserPermission } from './user-permission.entity';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string; // ex: "guarda", "enderecamento", "painel"

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // ex: "Acesso ao módulo de guarda"

  @Column({ type: 'varchar', length: 50 })
  module: string; // Nome do módulo (igual ao name por simplicidade)

  @OneToMany(() => UserPermission, (userPermission) => userPermission.permission)
  userPermissions: UserPermission[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
