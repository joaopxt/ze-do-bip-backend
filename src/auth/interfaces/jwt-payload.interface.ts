export interface JwtPayload {
  sub: string; // cd_usuario (codoper)
  nome: string;
  jti: string; // session ID (para whitelist)
  roles: string[]; // Array de nomes de roles (geralmente uma)
  permissions: string[]; // Array de nomes de módulos
  iat?: number; // issued at (automático)
  exp?: number; // expiration (automático)
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number; // segundos
  tokenType: 'Bearer';
}
