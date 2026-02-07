import { PartialType } from '@nestjs/swagger';
import { CreateProdNfcDto } from './create-prod_nfc.dto';

export class UpdateProdNfcDto extends PartialType(CreateProdNfcDto) {}
