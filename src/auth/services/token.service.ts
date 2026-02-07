import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, TokenResponse } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  private readonly expiresInSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // 30 dias em segundos
    this.expiresInSeconds = 30 * 24 * 60 * 60;
  }

  /**
   * Gera um token JWT com o session ID (jti), roles e permissions incluídos
   */
  async generateToken(
    cdUsuario: string,
    nome: string,
    sessionId: string,
    roles: string[] = [],
    permissions: string[] = [],
  ): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: cdUsuario,
      nome: nome,
      jti: sessionId, // Session ID para whitelist
      roles: roles,
      permissions: permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.expiresInSeconds,
    });

    return {
      accessToken,
      expiresIn: this.expiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  /**
   * Valida a assinatura do token (não verifica sessão no banco)
   */
  async validateToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verify(token);
  }

  /**
   * Decodifica o token sem validar (para extrair jti mesmo de tokens expirados)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Extrai o session ID (jti) de um token
   */
  extractSessionId(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.jti ?? null;
  }

  /**
   * Extrai as roles de um token
   */
  extractRoles(token: string): string[] {
    const decoded = this.decodeToken(token);
    return decoded?.roles ?? [];
  }

  /**
   * Extrai as permissions (módulos) de um token
   */
  extractPermissions(token: string): string[] {
    const decoded = this.decodeToken(token);
    return decoded?.permissions ?? [];
  }
}
