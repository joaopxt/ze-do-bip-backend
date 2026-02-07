import { PartialType } from '@nestjs/swagger';
import { CreateGuardaDto } from './create-guarda.dto';

export class UpdateGuardaDto extends PartialType(CreateGuardaDto) {}
