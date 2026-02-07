import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as https from 'https';

// Controllers
import { AuthController } from './auth.controller';
import { AdminPanelController } from './admin-panel.controller';

// Services
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { AuthorizationService } from './services/authorization.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { SeedService } from './services/seed.service';

// Strategies & Guards
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

// Entities
import { Session } from './entities/session.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { UserPermission } from './entities/user-permission.entity';
import { RolePermission } from './entities/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      Role,
      Permission,
      UserRole,
      UserPermission,
      RolePermission,
    ]),
    HttpModule.register({
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // APIs SIAC usam certificados auto-assinados
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Backend-ZeDoBip-Auth/1.0',
      },
    }),
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '12h',
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AdminPanelController],
  providers: [
    // Services
    AuthService,
    TokenService,
    SessionService,
    AuthorizationService,
    RoleService,
    PermissionService,
    SeedService,
    // Strategies & Guards
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    SessionService,
    AuthorizationService,
    RoleService,
    PermissionService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
