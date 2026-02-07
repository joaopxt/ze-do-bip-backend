// Resposta do SIAC /hash
export interface SiacHashResponse {
  success: boolean;
  data: {
    senha_hash: string;
    algoritmo: string;
  };
}

// Resposta do SIAC /auth
export interface SiacAuthResponse {
  success: boolean;
  cd_usuario?: string;
  nome?: string;
  token?: string;
  message?: string;
  data?: {
    cd_usuario: string;
    nome: string;
    token: string;
    message: string;
  };
}

// Resposta do SIAC /validate
export interface SiacValidateResponse {
  success: boolean;
  data: {
    valid: boolean;
    cd_usuario?: string;
    expires_at?: string;
  };
}
