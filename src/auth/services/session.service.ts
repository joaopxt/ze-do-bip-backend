import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  /**
   * Cria uma nova sessão no MySQL
   * @returns O ID da sessão criada (será usado como jti no JWT)
   */
  async createSession(
    cdUsuario: string,
    expiresInDays: number = 7,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const session = this.sessionRepository.create({
      cd_usuario: cdUsuario,
      device_info: deviceInfo,
      ip_address: ipAddress,
      is_active: true,
      expires_at: expiresAt,
    });

    const savedSession = await this.sessionRepository.save(session);
    return savedSession.id;
  }

  /**
   * Valida se uma sessão está ativa e não expirou
   */
  async validateSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        is_active: true,
        expires_at: MoreThan(new Date()),
      },
    });

    return session;
  }

  /**
   * Invalida uma sessão (logout)
   */
  async invalidateSession(sessionId: string): Promise<boolean> {
    const result = await this.sessionRepository.update(
      { id: sessionId },
      { is_active: false },
    );

    return (result.affected ?? 0) > 0;
  }

  /**
   * Invalida todas as sessões de um usuário (logout de todos dispositivos)
   */
  async invalidateAllSessions(cdUsuario: string): Promise<number> {
    const result = await this.sessionRepository.update(
      { cd_usuario: cdUsuario, is_active: true },
      { is_active: false },
    );

    return result.affected ?? 0;
  }

  /**
   * Lista todas as sessões ativas de um usuário
   */
  async getActiveSessions(cdUsuario: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        cd_usuario: cdUsuario,
        is_active: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Limpa sessões expiradas (pode ser usado em um cron job)
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.update(
      {
        is_active: true,
        expires_at: MoreThan(new Date()),
      },
      { is_active: false },
    );

    return result.affected ?? 0;
  }
}
