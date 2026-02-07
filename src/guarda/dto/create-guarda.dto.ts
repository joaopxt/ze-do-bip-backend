import { Compra } from 'src/compra/entities/compra.entity';
import { Estoquista } from 'src/estoquista/entities/estoquista.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGuardaDto {
  @ApiProperty()
  compra: Compra;

  @ApiProperty()
  estoquista: Estoquista;
}

export class CreateGuardaSeederDto {
  @IsString()
  @IsNotEmpty({ message: 'Código do fornecedor é obrigatório' })
  cd_fornece: string;

  @IsString()
  @IsNotEmpty({ message: 'Série da nota é obrigatório' })
  sg_serie: string;

  @IsString()
  @IsNotEmpty({ message: 'Número da nota é obrigatório' })
  nu_nota: string;

  @IsString()
  @IsNotEmpty({ message: 'Código do estoquista é obrigatório' })
  codoper: string;
}
