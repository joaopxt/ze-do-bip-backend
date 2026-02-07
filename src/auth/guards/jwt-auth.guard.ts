import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar se é rota pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Em desenvolvimento, verificar se o token é ADMIN_DEV
    if (process.env.NODE_ENV === 'development') {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '').trim();
        const adminDevKey = this.configService.get<string>('ADMIN_DEV');

        if (adminDevKey && token === adminDevKey) {
          // Injetar usuário admin fictício com todas as permissões
          request.user = {
            cd_usuario: 'ADMIN_DEV',
            nome: 'Admin Development',
            sessionId: 'dev-session',
            roles: ['admin'],
            permissions: ['guarda', 'enderecamento', 'painel'],
          };
          return true;
        }
      }
    }

    // Se não for ADMIN_DEV, usar validação JWT normal
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Se já temos um usuário (ADMIN_DEV), retornar ele
    if (user && user.cd_usuario === 'ADMIN_DEV') {
      return user;
    }

    // Caso contrário, usar comportamento padrão
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }
}
