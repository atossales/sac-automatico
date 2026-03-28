import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';
import { prisma } from '../../config/database.js';
import { generateResponse } from '../ai/ai.service.js';
import { logger } from '../../utils/logger.js';

export const playgroundRouter = Router();

playgroundRouter.use(authenticate, requireRole('admin'));

const testSchema = z.object({
  accountId: z.string().min(1, 'accountId é obrigatório'),
  message: z.string().min(1, 'message é obrigatório').max(2000),
});

/**
 * POST /playground/test
 * Simula a resposta da IA para uma mensagem, sem enviar DM.
 * Usa a persona configurada da conta, sem delay humanizado.
 */
playgroundRouter.post('/test', async (req, res, next) => {
  try {
    const { accountId, message } = testSchema.parse(req.body);

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, systemPrompt: true, isActive: true },
    });

    if (!account) {
      throw new AppError(404, 'Conta não encontrada', 'ACCOUNT_NOT_FOUND');
    }

    if (!account.isActive) {
      throw new AppError(409, 'Conta está desativada', 'ACCOUNT_INACTIVE');
    }

    const startTime = Date.now();

    const result = await generateResponse(
      account.systemPrompt,
      [], // Sem histórico no playground
      message,
    );

    const latencyMs = Date.now() - startTime;

    logger.info({ accountId, latencyMs }, 'Playground: resposta gerada com sucesso');

    res.json({
      data: {
        response: result.response,
        tokensUsed: result.tokensUsed ?? 0,
        latencyMs,
      },
    });
  } catch (err) {
    next(err);
  }
});
