import { PartialType } from '@nestjs/swagger';
import { CreateBipagemParcialEnderecoDto } from './create-bipagem-parcial-endereco.dto';

export class UpdateBipagemParcialEnderecoDto extends PartialType(CreateBipagemParcialEnderecoDto) {}
