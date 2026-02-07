import { IsString, IsNotEmpty, MinLength } from 'class-validator';

// Request do Mobile
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  cd_usuario: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  senha: string;
}

// Response para o Mobile
export class LoginResponseDto {
  success: boolean;
  data: {
    cd_usuario: string;
    nome: string;
    token: string; // JWT access token (30 dias)
    expiresIn: number; // segundos
    roles: string[]; // Array de roles (ex: ["armazenista"] ou ["admin"])
    permissions: string[]; // Array de módulos (ex: ["guarda", "enderecamento"])
    message: string;
  };
}
