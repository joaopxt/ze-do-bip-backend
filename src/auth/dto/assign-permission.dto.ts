import { IsString, IsNotEmpty, IsNumber, MaxLength } from 'class-validator';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Código do operador é obrigatório' })
  @MaxLength(5)
  codoper: string;

  @IsNumber()
  @IsNotEmpty({ message: 'ID da permissão é obrigatório' })
  permission_id: number;
}
