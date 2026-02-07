import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SyncUpCargaVolumeDto {
  @IsString()
  id: string;

  @IsString()
  status: string; // pendente | bipado

  @IsOptional()
  @IsString()
  dt_bipagem: string | null;
}

class SyncUpCargaDto {
  @IsString()
  id: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  dt_inicio: string | null;

  @IsOptional()
  @IsString()
  dt_fim: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncUpCargaVolumeDto)
  volumes: SyncUpCargaVolumeDto[];
}

class SyncUpVolumeDto {
  @IsString()
  id: string;

  @IsString()
  status: string; // pendente | entregue | extraviado

  @IsOptional()
  @IsString()
  observacao: string | null;

  @IsOptional()
  @IsString()
  dt_bipagem: string | null;
}

class SyncUpOrdemDto {
  @IsString()
  id: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  dt_inicio: string | null;

  @IsOptional()
  @IsString()
  dt_fim: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncUpVolumeDto)
  volumes: SyncUpVolumeDto[];
}

class SyncUpClienteDto {
  @IsString()
  id: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  dt_inicio: string | null;

  @IsOptional()
  @IsString()
  dt_fim: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncUpOrdemDto)
  ordens: SyncUpOrdemDto[];
}

export class SyncUpDto {
  @ApiProperty({ description: 'ID da rota' })
  @IsString()
  @IsNotEmpty()
  rota_id: string;

  @ApiProperty({ description: 'ID do motorista' })
  @IsString()
  @IsNotEmpty()
  motorista_id: string;

  @ApiProperty({ description: 'Data/hora do sync down original' })
  @IsString()
  dt_sync_down: string;

  @ApiProperty({ description: 'Data/hora do sync up' })
  @IsString()
  dt_sync_up: string;

  @ApiProperty({ description: 'Dados da carga' })
  @ValidateNested()
  @Type(() => SyncUpCargaDto)
  carga: SyncUpCargaDto;

  @ApiProperty({ description: 'Dados dos clientes com ordens e volumes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncUpClienteDto)
  clientes: SyncUpClienteDto[];
}
