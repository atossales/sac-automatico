import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — padrão recomendado para GCM
const AUTH_TAG_LENGTH = 16; // 128 bits — máximo de segurança
const ENCODING = 'hex' as const;

/**
 * Formato do token criptografado: iv:authTag:ciphertext
 * Todos os componentes em hexadecimal.
 */

/**
 * Criptografa um token de acesso usando AES-256-GCM.
 * Nunca armazene tokens em texto puro no banco de dados.
 *
 * @param plaintext - Token em texto puro
 * @returns String criptografada no formato "iv:authTag:ciphertext"
 */
export function encryptToken(plaintext: string): string {
  const key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, ENCODING);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted.toString(ENCODING),
  ].join(':');
}

/**
 * Descriptografa um token criptografado por `encryptToken`.
 * Lança erro se o token for inválido ou tiver sido adulterado.
 *
 * @param encryptedToken - String no formato "iv:authTag:ciphertext"
 * @returns Token em texto puro
 */
export function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de token criptografado inválido');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];

  const key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, ENCODING);
  const iv = Buffer.from(ivHex, ENCODING);
  const authTag = Buffer.from(authTagHex, ENCODING);
  const ciphertext = Buffer.from(ciphertextHex, ENCODING);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Compara dois buffers de forma segura contra ataques de timing.
 * Use para comparar assinaturas HMAC.
 */
export function safeCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    // Executa a comparação mesmo assim para não vazar informação de timing
    timingSafeEqual(Buffer.alloc(a.length), Buffer.alloc(a.length));
    return false;
  }
  return timingSafeEqual(a, b);
}
