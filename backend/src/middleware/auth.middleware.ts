import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './error.middleware.js';
import { logger } from '../utils/logger.js';

export interface JwtPayload {
  sub: string;
  role: 'admin' | 'client';
  iat?: number;
  exp?: number;
}

// Extende o tipo Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return token.length > 0 ? token : null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(new AppError(401, 'Token de autenticação ausente', 'MISSING_TOKEN'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expirado', 'TOKEN_EXPIRED'));
      return;
    }

    logger.warn({ err }, 'Token JWT inválido');
    next(new AppError(401, 'Token de autenticação inválido', 'INVALID_TOKEN'));
  }
}

export function requireRole(...roles: JwtPayload['role'][]): (req: Request, _res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Não autenticado', 'UNAUTHENTICATED'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.sub, role: req.user.role, requiredRoles: roles },
        'Acesso negado por role insuficiente',
      );
      next(new AppError(403, 'Acesso não autorizado', 'FORBIDDEN'));
      return;
    }

    next();
  };
}
