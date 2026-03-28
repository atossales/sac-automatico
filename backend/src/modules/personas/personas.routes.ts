import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';
import * as personasService from './personas.service.js';

export const personasRouter = Router();

personasRouter.use(authenticate, requireRole('admin'));

const accountIdSchema = z.object({
  accountId: z.string().min(1, 'accountId é obrigatório'),
});

const upsertPersonaSchema = z.object({
  systemPrompt: z.string(),
  delayMin: z.number().int().min(1).max(30),
  delayMax: z.number().int().min(1).max(30),
}).refine(
  (data) => data.delayMin <= data.delayMax,
  { message: 'delayMin deve ser menor ou igual a delayMax', path: ['delayMin'] },
);

/**
 * GET /personas/:accountId
 * Retorna a persona configurada para a conta.
 * Se não existir, retorna defaults.
 */
personasRouter.get('/:accountId', async (req, res, next) => {
  try {
    const { accountId } = accountIdSchema.parse(req.params);
    const data = await personasService.getPersona(accountId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /personas/:accountId
 * Atualiza (upsert) a persona da conta.
 */
personasRouter.put('/:accountId', async (req, res, next) => {
  try {
    const { accountId } = accountIdSchema.parse(req.params);
    const body = upsertPersonaSchema.parse(req.body);

    if (!body) {
      throw new AppError(400, 'Body inválido', 'INVALID_BODY');
    }

    const data = await personasService.upsertPersona(accountId, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
