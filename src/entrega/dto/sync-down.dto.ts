import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncDownDto {
  @ApiProperty({ description: 'ID do motorista logado' })
  @IsString()
  @IsNotEmpty()
  motorista_id: string;
}
