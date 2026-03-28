import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { login } from './auth.service.js';
import { AppError } from '../../middleware/error.middleware.js';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * POST /auth/login
 * Autentica o usuário e retorna um JWT de acesso.
 */
authRouter.post('/login', (req: Request, res: Response, next: NextFunction): void => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    next(new AppError(400, 'Dados de login inválidos', 'VALIDATION_ERROR'));
    return;
  }

  const { username, password } = parsed.data;

  login(username, password)
    .then((result) => {
      res.json({
        token: result.token,
        expiresIn: result.expiresIn,
      });
    })
    .catch(next);
});
