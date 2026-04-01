import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as automationController from './automation.controller.js';

export const automationRouter = Router();

// Todas as rotas de automacao requerem autenticacao + role admin
automationRouter.use(authenticate, requireRole('admin'));

/**
 * GET /automation/:accountId
 * Lista automacoes de uma conta.
 */
automationRouter.get('/:accountId', automationController.listAutomations);

/**
 * POST /automation
 * Cria uma nova automacao.
 */
automationRouter.post('/', automationController.createAutomation);

/**
 * PUT /automation/:id
 * Atualiza uma automacao existente.
 */
automationRouter.put('/:id', automationController.updateAutomation);

/**
 * DELETE /automation/:id
 * Deleta uma automacao.
 */
automationRouter.delete('/:id', automationController.deleteAutomation);
