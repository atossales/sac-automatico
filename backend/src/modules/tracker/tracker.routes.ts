import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { redirect } from './tracker.controller.js';

export const trackerRouter = Router();

// Rate limiting para prevenir inflação artificial de cliques
const trackerRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Muitas requisições. Tente novamente em breve.', code: 'RATE_LIMITED' } },
});

/**
 * GET /t/:code
 * Redirect rastreado para URL original.
 */
trackerRouter.get('/:code', trackerRateLimit, redirect);
