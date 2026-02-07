import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se é rota pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Obter permissões (módulos) necessárias do decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há permissões requeridas, permitir acesso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obter usuário do request (injetado pelo JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.cd_usuario) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Se for ADMIN_DEV, sempre permitir
    if (user.cd_usuario === 'ADMIN_DEV') {
      return true;
    }

    // Verificar se usuário tem pelo menos uma das permissões requeridas
    // Primeiro verificar se permissions estão no objeto user (do JWT)
    if (user.permissions && user.permissions.length > 0) {
      for (const permission of requiredPermissions) {
        if (user.permissions.includes(permission)) {
          return true;
        }
      }
    }

    // Se não tiver permissions no user, buscar do banco
    for (const permission of requiredPermissions) {
      const hasPermission = await this.authorizationService.hasModuleAccess(
        user.cd_usuario,
        permission,
      );
      if (hasPermission) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Acesso negado. Permissão necessária: ${requiredPermissions.join(' ou ')}`,
    );
  }
}
