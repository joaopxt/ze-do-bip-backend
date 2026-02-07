// create-produtos_guarda.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, MaxLength } from 'class-validator';

export class CreateProdutosGuardaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MaxLength(6)
  cd_produto: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  sq_guarda: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;
}
