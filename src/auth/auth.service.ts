import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ValidateTokenResponseDto } from './dto/validate-token.dto';
import { SiacAuthResponse } from './interfaces/siac.interface';
import { encryptedBase64 } from './utils/siacCrypto.util';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { AuthorizationService } from './services/authorization.service';
import { PermissionService } from './services/permission.service';

@Injectable()
export class AuthService {
  private readonly siacUrl?: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly authorizationService: AuthorizationService,
    private readonly permissionService: PermissionService,
  ) {
    this.siacUrl =
      this.configService.get<string>('SIAC_BASE_URL') ||
      process.env.SIAC_BASE_URL;
  }

  async login(
    dto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    const sessaoAtiva = await this.sessionService.getActiveSessions(
      dto.cd_usuario,
    );
    if (sessaoAtiva.length > 0) {
      throw new UnauthorizedException('Usuário já está logado');
    }

    // 1. Gerar hash da senha
    const senhaHash = encryptedBase64(dto.senha);

    // 2. Autenticar no SIAC
    const siacResponse = await this.httpService.axiosRef.post<SiacAuthResponse>(
      `${this.siacUrl}/AUTH_SIAC`,
      {
        cd_usuario: dto.cd_usuario,
        senha_hash: senhaHash,
      },
    );

    if (!siacResponse.data?.success) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    // 3. Criar sessão no MySQL
    const siacData = siacResponse.data;
    const nome = siacData?.nome || siacData?.data?.nome || dto.cd_usuario;

    const sessionId = await this.sessionService.createSession(
      dto.cd_usuario,
      30, // 30 dias
      deviceInfo,
      ipAddress,
    );

    // 4. Garantir que o usuário tem permissão de "guarda" (permissão padrão)
    await this.permissionService.ensureDefaultPermission(dto.cd_usuario);

    // 5. Buscar roles e permissions do usuário
    const roles = await this.authorizationService.getUserRolesForJwt(
      dto.cd_usuario,
    );
    const modules = await this.authorizationService.getUserModules(
      dto.cd_usuario,
    );

    // 6. Gerar JWT com session ID (jti), roles e permissions
    const tokens = await this.tokenService.generateToken(
      dto.cd_usuario,
      nome,
      sessionId,
      roles,
      modules,
    );

    // 7. Retornar JWT com roles e permissions
    return {
      success: true,
      data: {
        cd_usuario: dto.cd_usuario,
        nome: nome,
        token: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        roles: roles,
        permissions: modules,
        message: 'Login realizado com sucesso',
      },
    };
  }

  async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    try {
      // 1. Validar assinatura do JWT
      const payload = await this.tokenService.validateToken(token);

      // 2. Verificar se sessão está ativa no MySQL
      const session = await this.sessionService.validateSession(payload.jti);

      if (!session) {
        return {
          success: true,
          data: { valid: false },
        };
      }

      return {
        success: true,
        data: {
          valid: true,
          cd_usuario: payload.sub,
          nome: payload.nome,
          expires_at: new Date(payload.exp! * 1000).toISOString(),
        },
      };
    } catch {
      return {
        success: true,
        data: { valid: false },
      };
    }
  }

  /**
   * Logout da sessão atual
   */
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    const sessionId = this.tokenService.extractSessionId(token);

    if (!sessionId) {
      throw new UnauthorizedException('Token inválido');
    }

    const invalidated = await this.sessionService.invalidateSession(sessionId);

    return {
      success: invalidated,
      message: invalidated
        ? 'Logout realizado com sucesso'
        : 'Sessão não encontrada',
    };
  }

  /**
   * Logout de todas as sessões do usuário
   */
  async logoutAll(cdUsuario: string): Promise<{
    success: boolean;
    message: string;
    sessionsInvalidated: number;
  }> {
    const count = await this.sessionService.invalidateAllSessions(cdUsuario);

    return {
      success: true,
      message: `${count} sessão(ões) invalidada(s)`,
      sessionsInvalidated: count,
    };
  }

  /**
   * Lista sessões ativas do usuário
   */
  async getActiveSessions(cdUsuario: string) {
    const sessions = await this.sessionService.getActiveSessions(cdUsuario);

    return {
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        device_info: s.device_info,
        ip_address: s.ip_address,
        created_at: s.created_at,
        expires_at: s.expires_at,
      })),
    };
  }
}
