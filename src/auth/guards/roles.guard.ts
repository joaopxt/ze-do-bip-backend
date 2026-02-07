import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class RolesGuard implements CanActivate {
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

    // Obter roles necessárias do decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles requeridas, permitir acesso
    if (!requiredRoles || requiredRoles.length === 0) {
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

    // Verificar se usuário tem pelo menos uma das roles requeridas
    // Primeiro verificar se roles estão no objeto user (do JWT)
    if (user.roles && user.roles.length > 0) {
      for (const role of requiredRoles) {
        if (user.roles.includes(role)) {
          return true;
        }
      }
    }

    // Se não tiver roles no user, buscar do banco
    for (const role of requiredRoles) {
      const hasRole = await this.authorizationService.hasRole(
        user.cd_usuario,
        role,
      );
      if (hasRole) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Acesso negado. Role necessária: ${requiredRoles.join(' ou ')}`,
    );
  }
}
