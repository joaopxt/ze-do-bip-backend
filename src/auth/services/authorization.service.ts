import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { RolePermission } from '../entities/role-permission.entity';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @Optional()
    @InjectDataSource()
    private readonly mysqlDataSource: DataSource,
  ) {}

  /**
   * Verifica se o usuário tem uma role específica
   */
  async hasRole(codoper: string, roleName: string): Promise<boolean> {
    const userRole = await this.userRoleRepository.findOne({
      where: { codoper },
      relations: ['role'],
    });

    return userRole?.role?.name === roleName;
  }

  /**
   * Verifica se o usuário tem acesso a um módulo específico
   * Considera permissões via role + permissões customizadas
   */
  async hasModuleAccess(codoper: string, moduleName: string): Promise<boolean> {
    // 1. Verificar permissões via role
    const userRole = await this.userRoleRepository.findOne({
      where: { codoper },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    if (userRole?.role?.rolePermissions) {
      const hasViaRole = userRole.role.rolePermissions.some(
        (rp) => rp.permission.name === moduleName,
      );
      if (hasViaRole) return true;
    }

    // 2. Verificar permissões customizadas
    const userPermission = await this.userPermissionRepository.findOne({
      where: { codoper, granted: true },
      relations: ['permission'],
    });

    if (userPermission?.permission?.name === moduleName) {
      return true;
    }

    // 3. Verificar todas as permissões customizadas
    const customPermissions = await this.userPermissionRepository.find({
      where: { codoper, granted: true },
      relations: ['permission'],
    });

    return customPermissions.some((cp) => cp.permission.name === moduleName);
  }

  /**
   * Alias para hasModuleAccess
   */
  async hasPermission(
    codoper: string,
    permissionName: string,
  ): Promise<boolean> {
    return this.hasModuleAccess(codoper, permissionName);
  }

  /**
   * Retorna a role do usuário (relação 1x1)
   */
  async getUserRole(codoper: string): Promise<Role | null> {
    const userRole = await this.userRoleRepository.findOne({
      where: { codoper },
      relations: ['role'],
    });

    return userRole?.role || null;
  }

  /**
   * Retorna todas as permissões (módulos) do usuário
   * Combina permissões via role + permissões customizadas
   */
  async getUserPermissions(codoper: string): Promise<Permission[]> {
    const permissionsMap = new Map<number, Permission>();

    // 1. Buscar permissões via role
    const userRole = await this.userRoleRepository.findOne({
      where: { codoper },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    if (userRole?.role?.rolePermissions) {
      for (const rp of userRole.role.rolePermissions) {
        permissionsMap.set(rp.permission.id, rp.permission);
      }
    }

    // 2. Buscar permissões customizadas
    const customPermissions = await this.userPermissionRepository.find({
      where: { codoper, granted: true },
      relations: ['permission'],
    });

    for (const cp of customPermissions) {
      permissionsMap.set(cp.permission.id, cp.permission);
    }

    return Array.from(permissionsMap.values());
  }

  /**
   * Retorna array de nomes de módulos que o usuário tem acesso
   */
  async getUserModules(codoper: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(codoper);
    return permissions.map((p) => p.name);
  }

  /**
   * Retorna roles para incluir no JWT (array com uma role ou vazio)
   */
  async getUserRolesForJwt(codoper: string): Promise<string[]> {
    const role = await this.getUserRole(codoper);
    return role ? [role.name] : [];
  }

  /**
   * Retorna role e permissões de um usuário de forma consolidada
   * Combina permissões via role + permissões customizadas
   */
  async getUserRoleAndPermissions(codoper: string): Promise<{
    codoper: string;
    nomeUsuario: string;
    role: {
      id: number;
      name: string;
      description: string;
    } | null;
    permissions: {
      id: number;
      name: string;
      description: string;
      module: string;
      source: 'role' | 'custom';
    }[];
    modules: string[];
  }> {
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

    // 1. Buscar role do usuário com suas permissões
    const userRole = await this.userRoleRepository.findOne({
      where: { codoper },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    const role = userRole?.role || null;

    // 2. Buscar permissões customizadas do usuário
    const customUserPermissions = await this.userPermissionRepository.find({
      where: { codoper, granted: true },
      relations: ['permission'],
    });

    // 3. Criar mapa de permissões (id -> permission) para evitar duplicatas
    const permissionsMap = new Map<
      number,
      {
        id: number;
        name: string;
        description: string;
        module: string;
        source: 'role' | 'custom';
      }
    >();

    // 4. Adicionar permissões via role
    if (userRole?.role?.rolePermissions) {
      for (const rp of userRole.role.rolePermissions) {
        permissionsMap.set(rp.permission.id, {
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          module: rp.permission.module || rp.permission.name,
          source: 'role',
        });
      }
    }

    // 5. Adicionar/sobrescrever com permissões customizadas (source: 'custom')
    for (const cup of customUserPermissions) {
      permissionsMap.set(cup.permission.id, {
        id: cup.permission.id,
        name: cup.permission.name,
        description: cup.permission.description || '',
        module: cup.permission.module || cup.permission.name,
        source: 'custom',
      });
    }

    const permissions = Array.from(permissionsMap.values());
    const modules = permissions.map((p) => p.name);

    return {
      codoper,
      nomeUsuario: user[0].operador,
      role: role
        ? {
            id: role.id,
            name: role.name,
            description: role.description || '',
          }
        : null,
      permissions,
      modules,
    };
  }

  /**
   * Retorna todos os usuários com role ADMIN
   */
  async getAdminUsers(): Promise<Array<{ nome: string; role: string }>> {
    // Buscar role "admin" primeiro
    const adminRole = await this.roleRepository.findOne({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      return [];
    }

    // Buscar todos os user_roles com role_id = adminRole.id
    const adminUserRoles = await this.userRoleRepository.find({
      where: { role_id: adminRole.id },
      relations: ['role'],
    });

    // Buscar nomes dos usuários na tabela tpd013
    const codopers = adminUserRoles.map((ur) => ur.codoper);

    if (codopers.length === 0) {
      return [];
    }

    // Query para buscar nomes dos usuários no MySQL
    let usuarios: Array<{ codoper: string; operador: string }> = [];

    if (this.mysqlDataSource) {
      const placeholders = codopers.map(() => '?').join(',');
      usuarios = await this.mysqlDataSource.query(
        `SELECT codoper, operador FROM tpd013 WHERE codoper IN (${placeholders})`,
        codopers,
      );
    }

    // Criar mapa de codoper -> nome
    const nomeMap = new Map<string, string>();
    usuarios.forEach((u) => {
      nomeMap.set(u.codoper, u.operador || u.codoper);
    });

    // Retornar array com nome e role
    return adminUserRoles.map((userRole) => ({
      nome: nomeMap.get(userRole.codoper) || userRole.codoper,
      codoper: userRole.codoper,
      role: userRole.role.name,
    }));
  }

  /**
   * Retorna os 10 primeiros usuários com role ARMAZENISTA
   */
  async getArmazenistaUsers(): Promise<Array<{ nome: string; role: string }>> {
    // Buscar role "armazenista" primeiro
    const armazenistaRole = await this.roleRepository.findOne({
      where: { name: 'armazenista' },
    });

    if (!armazenistaRole) {
      return [];
    }

    // Buscar os 10 primeiros user_roles com role_id = armazenistaRole.id
    const armazenistaUserRoles = await this.userRoleRepository.find({
      where: { role_id: armazenistaRole.id },
      relations: ['role'],
      order: { created_at: 'DESC' }, // Ordenar por data de criação (mais recentes primeiro)
    });

    // Buscar nomes dos usuários na tabela tpd013
    const codopers = armazenistaUserRoles.map((ur) => ur.codoper);

    if (codopers.length === 0) {
      return [];
    }

    // Query para buscar nomes dos usuários no MySQL
    let usuarios: Array<{ codoper: string; operador: string }> = [];

    if (this.mysqlDataSource) {
      const placeholders = codopers.map(() => '?').join(',');
      usuarios = await this.mysqlDataSource.query(
        `SELECT codoper, operador FROM tpd013 WHERE codoper IN (${placeholders})`,
        codopers,
      );
    }

    // Criar mapa de codoper -> nome
    const nomeMap = new Map<string, string>();
    usuarios.forEach((u) => {
      nomeMap.set(u.codoper, u.operador || u.codoper);
    });

    // Retornar array com nome e role
    return armazenistaUserRoles.map((userRole) => ({
      nome: nomeMap.get(userRole.codoper) || userRole.codoper,
      codoper: userRole.codoper,
      role: userRole.role.name,
    }));
  }
}
