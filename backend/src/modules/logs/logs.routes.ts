import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as logsService from './logs.service.js';

export const logsRouter = Router();

logsRouter.use(authenticate, requireRole('admin'));

const logsQuerySchema = z.object({
  accountId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /logs
 * Lista logs de processamento com filtros opcionais.
 */
logsRouter.get('/', async (req, res, next) => {
  try {
    const query = logsQuerySchema.parse(req.query);
    const result = await logsService.listLogs(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
