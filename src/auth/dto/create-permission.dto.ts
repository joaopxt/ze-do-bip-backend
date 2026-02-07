import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da permissão é obrigatório' })
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  module?: string;
}
