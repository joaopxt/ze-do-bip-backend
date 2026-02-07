import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    this.logger.log('Iniciando seed de roles e permissions...');

    // Criar permissões (módulos)
    const permissionsData = [
      {
        name: 'guarda',
        description: 'Acesso ao módulo de guarda',
        module: 'guarda',
      },
      {
        name: 'enderecamento',
        description: 'Acesso ao módulo de endereçamento',
        module: 'enderecamento',
      },
      {
        name: 'painel',
        description: 'Acesso ao painel de administração',
        module: 'painel',
      },
    ];

    const permissions: Permission[] = [];
    for (const permData of permissionsData) {
      let permission = await this.permissionRepository.findOne({
        where: { name: permData.name },
      });

      if (!permission) {
        permission = await this.permissionRepository.save(
          this.permissionRepository.create(permData),
        );
        this.logger.log(`Permissão criada: ${permData.name}`);
      }
      permissions.push(permission);
    }

    // Criar roles
    const rolesData = [
      {
        name: 'armazenista',
        description: 'Usuário armazenista com acesso ao módulo de guarda',
        permissionNames: ['guarda'],
      },
      {
        name: 'admin',
        description:
          'Administrador com acesso a todos os módulos e painel de controle',
        permissionNames: ['guarda', 'enderecamento', 'painel'],
      },
    ];

    for (const roleData of rolesData) {
      let role = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!role) {
        role = await this.roleRepository.save(
          this.roleRepository.create({
            name: roleData.name,
            description: roleData.description,
          }),
        );
        this.logger.log(`Role criada: ${roleData.name}`);
      }

      // Associar permissões à role
      for (const permName of roleData.permissionNames) {
        const permission = permissions.find((p) => p.name === permName);
        if (permission) {
          const existing = await this.rolePermissionRepository.findOne({
            where: { role_id: role.id, permission_id: permission.id },
          });

          if (!existing) {
            await this.rolePermissionRepository.save(
              this.rolePermissionRepository.create({
                role_id: role.id,
                permission_id: permission.id,
              }),
            );
            this.logger.log(
              `Permissão ${permName} associada à role ${roleData.name}`,
            );
          }
        }
      }
    }

    this.logger.log('Seed concluído!');
  }
}
