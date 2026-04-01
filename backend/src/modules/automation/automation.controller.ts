import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as automationService from './automation.service.js';

const accountIdSchema = z.object({
  accountId: z.string().min(1, 'accountId e obrigatorio'),
});

const automationIdSchema = z.object({
  id: z.string().min(1, 'id e obrigatorio'),
});

const automationTypeEnum = z.enum(['WELCOME', 'KEYWORD', 'STORY_MENTION']);

const createAutomationSchema = z.object({
  accountId: z.string().min(1, 'accountId e obrigatorio'),
  type: automationTypeEnum,
  triggerValue: z.string().min(1).optional().nullable(),
  message: z.string().min(1, 'message nao pode ser vazio'),
  isActive: z.boolean().optional(),
});

const updateAutomationSchema = z.object({
  type: automationTypeEnum.optional(),
  triggerValue: z.string().min(1).optional().nullable(),
  message: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /automation/:accountId
 * Lista todas as automacoes de uma conta.
 */
export async function listAutomations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accountId } = accountIdSchema.parse(req.params);
    const automations = await automationService.listAutomations(accountId);
    res.json({ data: automations });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /automation
 * Cria uma nova automacao.
 */
export async function createAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createAutomationSchema.parse(req.body);
    const automation = await automationService.createAutomation(data);
    res.status(201).json({ data: automation });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /automation/:id
 * Atualiza uma automacao existente.
 */
export async function updateAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = automationIdSchema.parse(req.params);
    const data = updateAutomationSchema.parse(req.body);
    const automation = await automationService.updateAutomation(id, data);
    res.json({ data: automation });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /automation/:id
 * Deleta uma automacao.
 */
export async function deleteAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = automationIdSchema.parse(req.params);
    await automationService.deleteAutomation(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
