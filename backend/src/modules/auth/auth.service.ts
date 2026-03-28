import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logger } from '../../utils/logger.js';

// Expiração: 8 horas (sistema privado, apenas 2 usuários)
const JWT_EXPIRES_IN_SECONDS = 8 * 60 * 60; // 28800

export interface LoginResult {
  token: string;
  expiresIn: number;
}

/**
 * Valida as credenciais e gera um JWT de acesso.
 * A senha armazenada em ADMIN_PASSWORD deve ser um hash bcrypt.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  // Compara username (sem timing-attack: bcrypt cobre a senha, username é público aqui)
  const isUsernameValid = username === env.ADMIN_USERNAME;

  // Sempre executa o compare para evitar timing attacks mesmo com username inválido
  const hashToCheck = isUsernameValid
    ? env.ADMIN_PASSWORD
    : '$2b$10$invalidhashpaddingtomakethisrun00000000000000000000000'; // hash fictício

  const isPasswordValid = await bcrypt.compare(password, hashToCheck);

  if (!isUsernameValid || !isPasswordValid) {
    logger.warn({ username }, 'Tentativa de login com credenciais inválidas');
    throw new AppError(401, 'Usuário ou senha incorretos', 'INVALID_CREDENTIALS');
  }

  const payload = {
    sub: username,
    role: 'admin' as const,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  });

  logger.info({ username }, 'Login realizado com sucesso');

  return {
    token,
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  };
}
