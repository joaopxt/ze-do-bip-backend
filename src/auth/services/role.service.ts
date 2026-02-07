import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @Optional()
    @InjectDataSource()
    private readonly mysqlDataSource: DataSource,
  ) {}

  /**
   * Cria uma nova role
   */
  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Role "${dto.name}" já existe`);
    }

    const role = this.roleRepository.create(dto);
    return this.roleRepository.save(role);
  }

  /**
   * Lista todas as roles
   */
  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Busca uma role por ID
   */
  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role com ID ${id} não encontrada`);
    }

    return role;
  }

  /**
   * Busca uma role por nome
   */
  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }

  /**
   * Atualiza uma role
   */
  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Role "${dto.name}" já existe`);
      }
    }

    Object.assign(role, dto);
    return this.roleRepository.save(role);
  }

  /**
   * Remove uma role
   */
  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }

  /**
   * Atribui uma role a um usuário (substitui a role anterior se existir)
   */
  async assignRoleToUser(codoper: string, roleId: number): Promise<UserRole> {
    // Verifica se o usuário existe
    const user = await this.mysqlDataSource.query(
      `SELECT * FROM tpd013 WHERE codoper = ?`,
      [codoper],
    );
    if (user.length === 0) {
      throw new NotFoundException(
        `Usuário com codoper ${codoper} não encontrado`,
      );
    }

    const role = await this.findOne(roleId);

    // Remove role anterior se existir (relação 1x1)
    await this.userRoleRepository.delete({ codoper });

    // Cria nova associação
    const userRole = this.userRoleRepository.create({
      codoper,
      role_id: role.id,
    });

    return this.userRoleRepository.save(userRole);
  }

  /**
   * Remove a role de um usuário
   */
  async removeRoleFromUser(codoper: string): Promise<boolean> {
    const result = await this.userRoleRepository.delete({ codoper });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Adiciona uma permissão (módulo) a uma role
   */
  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<RolePermission> {
    const role = await this.findOne(roleId);
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permissão com ID ${permissionId} não encontrada`,
      );
    }

    // Verifica se já existe
    const existing = await this.rolePermissionRepository.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });

    if (existing) {
      throw new ConflictException(
        'Esta permissão já está atribuída a esta role',
      );
    }

    const rolePermission = this.rolePermissionRepository.create({
      role_id: role.id,
      permission_id: permission.id,
    });

    return this.rolePermissionRepository.save(rolePermission);
  }

  /**
   * Remove uma permissão (módulo) de uma role
   */
  async removePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<boolean> {
    const result = await this.rolePermissionRepository.delete({
      role_id: roleId,
      permission_id: permissionId,
    });

    return (result.affected ?? 0) > 0;
  }

  /**
   * Lista permissões de uma role
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const role = await this.findOne(roleId);
    return role.rolePermissions.map((rp) => rp.permission);
  }
}
