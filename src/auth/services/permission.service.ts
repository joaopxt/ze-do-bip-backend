import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { UserPermission } from '../entities/user-permission.entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    private readonly authorizationService: AuthorizationService,
    @Optional()
    @InjectDataSource()
    private readonly mysqlDataSource: DataSource,
  ) {}

  /**
   * Cria uma nova permissão (módulo)
   */
  async create(dto: CreatePermissionDto): Promise<Permission> {
    const existing = await this.permissionRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Permissão "${dto.name}" já existe`);
    }

    const permission = this.permissionRepository.create({
      ...dto,
      module: dto.module || dto.name, // Se não informado, usa o name
    });

    return this.permissionRepository.save(permission);
  }

  /**
   * Lista todas as permissões (módulos)
   */
  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Busca uma permissão por ID
   */
  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permissão com ID ${id} não encontrada`);
    }

    return permission;
  }

  /**
   * Busca uma permissão por nome
   */
  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { name },
    });
  }

  /**
   * Atualiza uma permissão
   */
  async update(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    if (dto.name && dto.name !== permission.name) {
      const existing = await this.permissionRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Permissão "${dto.name}" já existe`);
      }
    }

    Object.assign(permission, dto);
    return this.permissionRepository.save(permission);
  }

  /**
   * Remove uma permissão
   */
  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }

  /**
   * Atribui uma permissão (módulo) customizada a um usuário
   */
  async assignPermissionToUser(
    codoper: string,
    permissionId: number,
  ): Promise<UserPermission> {
    const permission = await this.findOne(permissionId);

    // Verifica se já existe
    const existing = await this.userPermissionRepository.findOne({
      where: { codoper, permission_id: permissionId },
    });

    if (existing) {
      // Se já existe mas estava negado, atualiza para concedido
      if (!existing.granted) {
        existing.granted = true;
        return this.userPermissionRepository.save(existing);
      }
      throw new ConflictException(
        'Esta permissão já está atribuída a este usuário',
      );
    }

    const userPermission = this.userPermissionRepository.create({
      codoper,
      permission_id: permission.id,
      granted: true,
    });

    return this.userPermissionRepository.save(userPermission);
  }

  /**
   * Remove uma permissão (módulo) customizada de um usuário
   */
  async removePermissionFromUser(
    codoper: string,
    permissionId: number,
  ): Promise<boolean> {
    const result = await this.userPermissionRepository.delete({
      codoper,
      permission_id: permissionId,
    });

    return (result.affected ?? 0) > 0;
  }

  /**
   * Nega uma permissão customizada (útil para sobrescrever permissões da role)
   */
  async denyPermissionToUser(
    codoper: string,
    permissionId: number,
  ): Promise<UserPermission> {
    const permission = await this.findOne(permissionId);

    const existing = await this.userPermissionRepository.findOne({
      where: { codoper, permission_id: permissionId },
    });

    if (existing) {
      existing.granted = false;
      return this.userPermissionRepository.save(existing);
    }

    const userPermission = this.userPermissionRepository.create({
      codoper,
      permission_id: permission.id,
      granted: false,
    });

    return this.userPermissionRepository.save(userPermission);
  }

  /**
   * Lista permissões customizadas de um usuário
   */
  async getUserCustomPermissions(codoper: string): Promise<UserPermission[]> {
    return this.userPermissionRepository.find({
      where: { codoper },
      relations: ['permission'],
    });
  }

  /**
   * Garante que o usuário tem acesso ao módulo "guarda" (permissão padrão)
   * Verifica se já tem acesso via role ou permissão customizada
   * Se não tiver, atribui a permissão "guarda" como customizada
   */

  async ensureDefaultPermission(codoper: string): Promise<void> {
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
    // 1. Verificar se usuário já tem acesso ao módulo "guarda"
    const hasGuardaAccess = await this.authorizationService.hasModuleAccess(
      codoper,
      'guarda',
    );

    if (hasGuardaAccess) {
      // Usuário já tem acesso, não precisa fazer nada
      return;
    }

    // 2. Buscar ou criar permissão "guarda"
    let guardaPermission = await this.findByName('guarda');

    if (!guardaPermission) {
      throw new NotFoundException(`Permissão "guarda" não encontrada`);
    }

    // 3. Verificar se já existe permissão customizada (mesmo que negada)
    const existing = await this.userPermissionRepository.findOne({
      where: { codoper, permission_id: guardaPermission.id },
    });

    if (existing) {
      // Se existe mas está negada, atualizar para concedida
      if (!existing.granted) {
        throw new Error(`Permissão de guarda negada a este usuário`);
      }
      return;
    }

    // 4. Criar permissão customizada para o usuário
    const userPermission = this.userPermissionRepository.create({
      codoper,
      permission_id: guardaPermission.id,
      granted: true,
    });

    await this.userPermissionRepository.save(userPermission);
  }
}
