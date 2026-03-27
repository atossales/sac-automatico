import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as trackerService from './tracker.service.js';
import { logger } from '../../utils/logger.js';

const shortCodeSchema = z.object({
  code: z.string().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/, 'Código inválido'),
});

/**
 * GET /t/:code
 * Redireciona para a URL original e registra o clique.
 * Rate limiting aplicado na rota para evitar inflação artificial de cliques.
 */
export async function redirect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = shortCodeSchema.parse(req.params);

    const userAgent = req.headers['user-agent'] ?? '';
    const ip = req.ip ?? req.socket.remoteAddress ?? '';

    const originalUrl = await trackerService.registerClickAndGetUrl(code, userAgent, ip);

    logger.debug({ code }, 'Redirect executado');

    // 302 para que os cliques sejam sempre contabilizados (sem cache)
    res.redirect(302, originalUrl);
  } catch (err) {
    next(err);
  }
}
