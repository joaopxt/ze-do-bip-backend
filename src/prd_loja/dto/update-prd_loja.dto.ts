import { PartialType } from '@nestjs/swagger';
import { CreatePrdLojaDto } from './create-prd_loja.dto';

export class UpdatePrdLojaDto extends PartialType(CreatePrdLojaDto) {}
