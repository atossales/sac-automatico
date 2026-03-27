import type { Request, Response, NextFunction } from 'express';
import { createHmac } from 'node:crypto';
import { safeCompare } from '../utils/crypto.js';
import { AppError } from './error.middleware.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Middleware que valida a assinatura HMAC-SHA256 dos webhooks da Meta.
 *
 * A Meta envia o header `X-Hub-Signature-256` no formato:
 *   sha256=<hash_hex>
 *
 * Este middleware requer que o Express esteja configurado com
 * `express.raw()` ou `express.json({ verify: ... })` para preservar
 * o body bruto necessário para o cálculo do HMAC.
 *
 * NUNCA processe um webhook sem validar a assinatura (CLAUDE.md).
 */
export function validateMetaHmac(req: Request, _res: Response, next: NextFunction): void {
  const signatureHeader = req.headers['x-hub-signature-256'];

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    logger.warn({ path: req.path, ip: req.ip }, 'Webhook recebido sem X-Hub-Signature-256');
    next(new AppError(401, 'Assinatura do webhook ausente', 'MISSING_SIGNATURE'));
    return;
  }

  if (!signatureHeader.startsWith('sha256=')) {
    logger.warn({ path: req.path, ip: req.ip }, 'Formato de assinatura inválido');
    next(new AppError(401, 'Formato de assinatura inválido', 'INVALID_SIGNATURE_FORMAT'));
    return;
  }

  // O body precisa estar disponível como Buffer (configurado no app.ts)
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody) {
    logger.error({ path: req.path }, 'rawBody não disponível — verifique a configuração do middleware de body');
    next(new AppError(500, 'Erro de configuração do servidor', 'MISSING_RAW_BODY'));
    return;
  }

  const expectedSignature = `sha256=${createHmac('sha256', env.META_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')}`;

  const receivedBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (!safeCompare(receivedBuffer, expectedBuffer)) {
    logger.warn(
      { path: req.path, ip: req.ip },
      'Assinatura HMAC do webhook inválida — possível tentativa de falsificação',
    );
    next(new AppError(401, 'Assinatura do webhook inválida', 'INVALID_SIGNATURE'));
    return;
  }

  next();
}
