import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as analyticsService from './analytics.service.js';
import { AppError } from '../../middleware/error.middleware.js';

export const analyticsRouter = Router();

// Todas as rotas de analytics requerem autenticação
analyticsRouter.use(authenticate);

const accountIdSchema = z.object({
  accountId: z.string().min(1, 'accountId é obrigatório'),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /analytics/summary
 * Resumo de métricas de todas as contas (admin) ou da conta vinculada (client).
 */
analyticsRouter.get(
  '/summary',
  requireRole('admin', 'client'),
  async (req, res, next) => {
    try {
      if (req.user?.role === 'client') {
        // Client só vê métricas da própria conta
        const data = await analyticsService.getAccountSummary(req.user.sub);
        res.json({ data: [data] });
      } else {
        const data = await analyticsService.getAllAccountsSummary();
        res.json({ data });
      }
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /analytics/:accountId/summary
 * Resumo de métricas de uma conta específica (admin ou client).
 */
analyticsRouter.get(
  '/:accountId/summary',
  async (req, res, next) => {
    try {
      const { accountId } = accountIdSchema.parse(req.params);

      // Client só pode ver a própria conta
      if (req.user?.role === 'client' && req.user.sub !== accountId) {
        throw new AppError(403, 'Acesso não autorizado a esta conta', 'FORBIDDEN');
      }

      const data = await analyticsService.getAccountSummary(accountId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /analytics/:accountId/conversations
 * Lista de conversas recentes paginadas.
 */
analyticsRouter.get(
  '/:accountId/conversations',
  async (req, res, next) => {
    try {
      const { accountId } = accountIdSchema.parse(req.params);
      const { page, pageSize } = paginationSchema.parse(req.query);

      if (req.user?.role === 'client' && req.user.sub !== accountId) {
        throw new AppError(403, 'Acesso não autorizado a esta conta', 'FORBIDDEN');
      }

      const result = await analyticsService.getRecentConversations(accountId, page, pageSize);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /analytics/:accountId/clicks
 * Série temporal de cliques nos últimos 30 dias.
 */
analyticsRouter.get(
  '/:accountId/clicks',
  async (req, res, next) => {
    try {
      const { accountId } = accountIdSchema.parse(req.params);
      const days = z.coerce.number().int().positive().max(90).default(30).parse(req.query['days']);

      if (req.user?.role === 'client' && req.user.sub !== accountId) {
        throw new AppError(403, 'Acesso não autorizado a esta conta', 'FORBIDDEN');
      }

      const data = await analyticsService.getClickTimeSeries(accountId, days);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);
