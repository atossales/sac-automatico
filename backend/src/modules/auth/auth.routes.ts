import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { login, refreshAccessToken } from './auth.service.js';
import { AppError } from '../../middleware/error.middleware.js';

export const authRouter = Router();

// Rate limiting para login — protege contra brute force
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas por janela
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // não conta tentativas bem-sucedidas
  message: {
    error: {
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      code: 'RATE_LIMITED',
    },
  },
});

// Rate limiting para refresh — protege contra abuso de rotação
const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // máximo 30 refreshes por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Muitas tentativas de refresh. Tente novamente em 15 minutos.',
      code: 'RATE_LIMITED',
    },
  },
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

/**
 * POST /auth/login
 * Autentica o usuário e retorna um JWT de acesso + refresh token.
 */
authRouter.post('/login', loginRateLimit, (req: Request, res: Response, next: NextFunction): void => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    next(new AppError(400, 'Dados de login inválidos', 'VALIDATION_ERROR'));
    return;
  }

  const { username, password } = parsed.data;

  login(username, password)
    .then((result) => {
      res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    })
    .catch(next);
});

/**
 * POST /auth/refresh
 * Aceita um refresh token e emite novo par de tokens (rotação).
 */
authRouter.post('/refresh', refreshRateLimit, (req: Request, res: Response, next: NextFunction): void => {
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    next(new AppError(400, 'Refresh token não fornecido', 'VALIDATION_ERROR'));
    return;
  }

  try {
    const result = refreshAccessToken(parsed.data.refreshToken);

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    next(err);
  }
});
