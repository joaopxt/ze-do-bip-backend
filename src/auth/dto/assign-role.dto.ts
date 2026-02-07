import { IsString, IsNotEmpty, IsNumber, MaxLength } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Código do operador é obrigatório' })
  @MaxLength(5)
  codoper: string;

  @IsNumber()
  @IsNotEmpty({ message: 'ID da role é obrigatório' })
  role_id: number;
}
