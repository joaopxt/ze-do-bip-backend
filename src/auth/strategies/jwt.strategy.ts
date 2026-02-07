import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SessionService } from '../services/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
    });
  }

  async validate(payload: JwtPayload) {
    // Verificar se a sessão (jti) está ativa no MySQL
    const session = await this.sessionService.validateSession(payload.jti);

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    return {
      cd_usuario: payload.sub,
      nome: payload.nome,
      sessionId: payload.jti,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
