/**
 * Algoritmo de criptografia proprietário do SIAC
 * Replica a função encrypted_base64 do sistema legado
 */
export function encryptedBase64(texto: string): string {
  if (!texto) return '';

  const bytes: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    let code = texto.charCodeAt(i);
    if (code > 255) code = code & 0xff;
    bytes.push(code);
  }

  let encrypted = '';
  for (let i = 0; i < bytes.length; i++) {
    const newCharCode = (bytes[i] + 101 + (i + 1)) & 0xff;
    encrypted += String.fromCharCode(newCharCode);
  }

  return Buffer.from(encrypted, 'binary').toString('base64');
}

/**
 * Decodifica token SIAC (formato: cd_usuario_data_hora em Base64)
 */
export function decodeToken(token: string): {
  valid: boolean;
  cd_usuario: string;
  date: string;
  hora: string;
} | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [cd_usuario, date, hora] = decoded.split('_');
    console.log(
      `DECODE: token: ${token}, cd_usuario: ${cd_usuario}, date: ${date}, hora: ${hora}`,
    );
    if (!cd_usuario || !date || !hora) return null;

    return { cd_usuario, date, hora, valid: true };
  } catch {
    return null;
  }
}
