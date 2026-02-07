import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EstoquistaService } from './estoquista.service';
import { CreateEstoquistaDto } from './dto/create-estoquista.dto';
import { UpdateEstoquistaDto } from './dto/update-estoquista.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Estoquista')
@Controller('estoquista')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EstoquistaController {
  constructor(private readonly estoquistaService: EstoquistaService) {}

  @Public()
  @ApiOperation({ summary: 'Sync from Postgres' })
  @Post('sync')
  async syncFromPostgres() {
    return this.estoquistaService.syncFromPostgres();
  }
}
