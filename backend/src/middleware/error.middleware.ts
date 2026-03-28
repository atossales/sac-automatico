import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Mantém stack trace correto no Node.js
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

function buildErrorResponse(message: string, code?: string, details?: unknown): ErrorResponse {
  return {
    error: {
      message,
      ...(code !== undefined && { code }),
      ...(details !== undefined && { details }),
    },
  };
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Erros de validação do Zod
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn({ path: req.path, method: req.method, details }, 'Erro de validação');

    res.status(400).json(buildErrorResponse('Dados de entrada inválidos', 'VALIDATION_ERROR', details));
    return;
  }

  // Erros de aplicação conhecidos
  if (err instanceof AppError) {
    logger.warn(
      { path: req.path, method: req.method, statusCode: err.statusCode, code: err.code },
      err.message,
    );

    res.status(err.statusCode).json(buildErrorResponse(err.message, err.code));
    return;
  }

  // Erros inesperados — loga detalhes internamente mas não expõe ao cliente
  const error = err instanceof Error ? err : new Error(String(err));

  logger.error(
    { err: error, path: req.path, method: req.method },
    'Erro interno não tratado',
  );

  res.status(500).json(
    buildErrorResponse(
      'Erro interno do servidor',
      'INTERNAL_ERROR',
      // Expõe stack apenas em desenvolvimento
      process.env['NODE_ENV'] === 'development' ? error.stack : undefined,
    ),
  );
}
