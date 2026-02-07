import { PartialType } from '@nestjs/swagger';
import { CreateEstoquistaDto } from './create-estoquista.dto';

export class UpdateEstoquistaDto extends PartialType(CreateEstoquistaDto) {}
