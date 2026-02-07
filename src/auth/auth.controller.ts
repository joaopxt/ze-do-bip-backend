import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import {
  ValidateTokenDto,
  ValidateTokenResponseDto,
} from './dto/validate-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Req() req?: Request,
  ): Promise<LoginResponseDto> {
    const ipAddress =
      req?.ip || req?.headers['x-forwarded-for']?.toString() || undefined;
    return this.authService.login(dto, userAgent, ipAddress);
  }

  @Public()
  @Post('validate')
  async validate(
    @Body() dto: ValidateTokenDto,
  ): Promise<ValidateTokenResponseDto> {
    return this.authService.validateToken(dto.token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Post('logout-all')
  async logoutAll(@Body() body: { cd_usuario: string }, @Req() req: Request) {
    const cd_usuario = body.cd_usuario || (req.user as any)?.cd_usuario;
    return this.authService.logoutAll(cd_usuario);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Req() req: Request) {
    const user = req.user as { cd_usuario: string };
    return this.authService.getActiveSessions(user.cd_usuario);
  }
}
