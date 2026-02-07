import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AlterarEnderecoDto {
  @ApiProperty({
    description: 'Novo endereço para o produto',
    example: 'P01070002',
  })
  @IsString()
  @IsNotEmpty()
  enderecoNovo: string;
}
