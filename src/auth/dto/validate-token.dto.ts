import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ValidateTokenResponseDto {
  success: boolean;
  data: {
    valid: boolean;
    cd_usuario?: string;
    nome?: string;
    expires_at?: string;
  };
}
