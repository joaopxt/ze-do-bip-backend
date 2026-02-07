import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { AuthorizationService } from './services/authorization.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { UserPermissionsResponseDto } from './dto/user-permissions.dto';

@Controller('auth/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('painel')
export class AdminPanelController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  // ==================== ROLES ====================

  /**
   * Lista todas as roles
   */
  @Get('roles')
  async listRoles() {
    const roles = await this.roleService.findAll();
    return {
      success: true,
      data: roles,
    };
  }

  /**
   * Cria uma nova role
   */
  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.roleService.create(dto);
    return {
      success: true,
      data: role,
      message: 'Role criada com sucesso',
    };
  }

  /**
   * Busca uma role por ID
   */
  @Get('roles/:id')
  async getRole(@Param('id', ParseIntPipe) id: number) {
    const role = await this.roleService.findOne(id);
    return {
      success: true,
      data: role,
    };
  }

  /**
   * Atualiza uma role
   */
  @Put('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const role = await this.roleService.update(id, dto);
    return {
      success: true,
      data: role,
      message: 'Role atualizada com sucesso',
    };
  }

  /**
   * Remove uma role
   */
  @Delete('roles/:id')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    await this.roleService.remove(id);
    return {
      success: true,
      message: 'Role removida com sucesso',
    };
  }

  /**
   * Lista permissões (módulos) de uma role
   */
  @Get('roles/:id/permissions')
  async getRolePermissions(@Param('id', ParseIntPipe) id: number) {
    const permissions = await this.roleService.getRolePermissions(id);
    return {
      success: true,
      data: permissions,
    };
  }

  /**
   * Adiciona permissão (módulo) a uma role
   */
  @Post('roles/:roleId/permissions/:permissionId')
  async addPermissionToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    const rolePermission = await this.roleService.assignPermissionToRole(
      roleId,
      permissionId,
    );
    return {
      success: true,
      data: rolePermission,
      message: 'Permissão adicionada à role com sucesso',
    };
  }

  /**
   * Remove permissão (módulo) de uma role
   */
  @Delete('roles/:roleId/permissions/:permissionId')
  async removePermissionFromRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    const removed = await this.roleService.removePermissionFromRole(
      roleId,
      permissionId,
    );
    return {
      success: removed,
      message: removed
        ? 'Permissão removida da role com sucesso'
        : 'Permissão não encontrada na role',
    };
  }

  // ==================== PERMISSIONS (MÓDULOS) ====================

  /**
   * Lista todas as permissões (módulos)
   */
  @Get('permissions')
  async listPermissions() {
    const permissions = await this.permissionService.findAll();
    return {
      success: true,
      data: permissions,
    };
  }

  /**
   * Cria uma nova permissão (módulo)
   */
  @Post('permissions')
  async createPermission(@Body() dto: CreatePermissionDto) {
    const permission = await this.permissionService.create(dto);
    return {
      success: true,
      data: permission,
      message: 'Permissão criada com sucesso',
    };
  }

  /**
   * Busca uma permissão por ID
   */
  @Get('permissions/:id')
  async getPermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionService.findOne(id);
    return {
      success: true,
      data: permission,
    };
  }

  /**
   * Atualiza uma permissão
   */
  @Put('permissions/:id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionService.update(id, dto);
    return {
      success: true,
      data: permission,
      message: 'Permissão atualizada com sucesso',
    };
  }

  /**
   * Remove uma permissão
   */
  @Delete('permissions/:id')
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    await this.permissionService.remove(id);
    return {
      success: true,
      message: 'Permissão removida com sucesso',
    };
  }

  // ==================== USUÁRIOS ====================

  //GET usuarios com role ADMIN e listar seus dados
  @Get('users/admin')
  async getAdminUsers() {
    const adminUsers = await this.authorizationService.getAdminUsers();
    return {
      success: true,
      data: adminUsers,
    };
  }

  //GET usuarios com role ARMAZENISTA e listar seus dados
  @Get('users/armazenista')
  async getArmazenistaUsers() {
    const armazenistaUsers =
      await this.authorizationService.getArmazenistaUsers();
    return {
      success: true,
      data: armazenistaUsers,
    };
  }

  /**
   * Retorna role e permissões de um usuário
   */
  @Get('users/:codoper/modules')
  async getUserRoleAndPermissions(@Param('codoper') codoper: string): Promise<{
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
    return await this.authorizationService.getUserRoleAndPermissions(codoper);
  }

  /**
   * Atribui uma role a um usuário
   */
  @Post('users/:codoper/roles')
  async assignRoleToUser(
    @Param('codoper') codoper: string,
    @Body() dto: { role_id: number },
  ) {
    const userRole = await this.roleService.assignRoleToUser(
      codoper,
      dto.role_id,
    );
    return {
      success: true,
      data: userRole,
      message: 'Role atribuída ao usuário com sucesso',
    };
  }

  /**
   * Remove a role de um usuário
   */
  @Delete('users/:codoper/roles')
  async removeRoleFromUser(@Param('codoper') codoper: string) {
    const removed = await this.roleService.removeRoleFromUser(codoper);
    return {
      success: removed,
      message: removed
        ? 'Role removida do usuário com sucesso'
        : 'Usuário não possui role',
    };
  }

  /**
   * Atribui uma permissão (módulo) customizada a um usuário
   */
  @Post('users/:codoper/permissions')
  async assignPermissionToUser(
    @Param('codoper') codoper: string,
    @Body() dto: { permission_id: number },
  ) {
    const userPermission = await this.permissionService.assignPermissionToUser(
      codoper,
      dto.permission_id,
    );
    return {
      success: true,
      data: userPermission,
      message: 'Permissão atribuída ao usuário com sucesso',
    };
  }

  /**
   * Remove uma permissão (módulo) customizada de um usuário
   */
  @Delete('users/:codoper/permissions/:permissionId')
  async removePermissionFromUser(
    @Param('codoper') codoper: string,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    const removed = await this.permissionService.removePermissionFromUser(
      codoper,
      permissionId,
    );
    return {
      success: removed,
      message: removed
        ? 'Permissão removida do usuário com sucesso'
        : 'Permissão não encontrada para este usuário',
    };
  }
}
