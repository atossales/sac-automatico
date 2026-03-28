import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { queueService } from './queue.service.js';
import type { Job } from 'bullmq';
import type { IncomingDmJob } from '../instagram/instagram.types.js';

export const queueRouter = Router();

queueRouter.use(authenticate);

const jobsQuerySchema = z.object({
  status: z.enum(['waiting', 'active', 'failed', 'completed']).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

/**
 * GET /queue/stats
 * Retorna contadores da fila de mensagens.
 */
queueRouter.get('/stats', async (_req, res, next) => {
  try {
    const metrics = await queueService.getQueueMetrics();
    const data = {
      waiting: metrics.waiting,
      active: metrics.active,
      failed: metrics.failed,
      completed: metrics.completed,
    };
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /queue/jobs
 * Lista jobs da fila com filtro opcional por status.
 */
queueRouter.get('/jobs', async (req, res, next) => {
  try {
    const { status, limit } = jobsQuerySchema.parse(req.query);

    const queue = queueService.getQueue();

    type BullStatus = 'waiting' | 'active' | 'failed' | 'completed';
    const statuses: BullStatus[] = status
      ? [status as BullStatus]
      : ['waiting', 'active', 'failed', 'completed'];

    const jobArrays = await Promise.all(
      statuses.map((s) => queue.getJobs([s], 0, limit - 1)),
    );

    const jobs = jobArrays
      .flat()
      .slice(0, limit)
      .map((job: Job<IncomingDmJob>) => ({
        id: job.id ?? '',
        name: job.name,
        data: job.data as unknown as Record<string, unknown>,
        status: status ?? 'waiting',
        timestamp: new Date(job.timestamp).toISOString(),
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
        failedReason: job.failedReason ?? undefined,
      }));

    res.json({ data: jobs, total: jobs.length });
  } catch (err) {
    next(err);
  }
});
