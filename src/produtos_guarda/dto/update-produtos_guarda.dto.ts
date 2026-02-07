import { PartialType } from '@nestjs/swagger';
import { CreateProdutosGuardaDto } from './create-produtos_guarda.dto';

export class UpdateProdutosGuardaDto extends PartialType(CreateProdutosGuardaDto) {}
