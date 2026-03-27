import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateMetaHmac } from '../../middleware/hmac.middleware.js';
import { verifyWebhook, receiveWebhook } from './instagram.controller.js';

export const instagramRouter = Router();

// Rate limiting para rotas públicas do webhook
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // Meta pode enviar muitos eventos em batch
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Muitas requisições. Tente novamente em breve.', code: 'RATE_LIMITED' } },
});

/**
 * GET /instagram/webhook
 * Endpoint de verificação do webhook da Meta.
 * Deve responder ao hub.challenge enviado pela Meta.
 */
instagramRouter.get('/webhook', webhookRateLimit, verifyWebhook);

/**
 * POST /instagram/webhook
 * Recebe eventos de DM do Instagram.
 * Requer validação HMAC antes de processar qualquer dado.
 */
instagramRouter.post('/webhook', webhookRateLimit, validateMetaHmac, receiveWebhook);
