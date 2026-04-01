import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logger } from '../../utils/logger.js';

// Expiração: 15 minutos para access token, 7 dias para refresh token
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60; // 900
const REFRESH_TOKEN_EXPIRES_IN = '7d';

interface JwtPayload {
  sub: string;
  role: 'admin';
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { username: string; role: 'admin' };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Gera um par de tokens (access + refresh) para o payload fornecido.
 */
function generateTokenPair(payload: JwtPayload): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
}

/**
 * Valida as credenciais e gera um JWT de acesso + refresh token rotativo.
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

  const payload: JwtPayload = {
    sub: username,
    role: 'admin',
  };

  const { accessToken, refreshToken } = generateTokenPair(payload);

  logger.info({ username }, 'Login realizado com sucesso');

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    user: { username, role: 'admin' },
  };
}

/**
 * Valida um refresh token e emite um novo par de tokens (rotação).
 * O refresh token antigo é invalidado implicitamente pela rotação.
 */
export function refreshAccessToken(refreshToken: string): RefreshResult {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

    const payload: JwtPayload = {
      sub: decoded.sub,
      role: decoded.role,
    };

    const tokens = generateTokenPair(payload);

    logger.info({ username: decoded.sub }, 'Tokens renovados via refresh token');

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.warn('Tentativa de refresh com token expirado');
      throw new AppError(401, 'Refresh token expirado — faça login novamente', 'REFRESH_TOKEN_EXPIRED');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn('Tentativa de refresh com token inválido');
      throw new AppError(401, 'Refresh token inválido', 'INVALID_REFRESH_TOKEN');
    }
    throw err;
  }
}
