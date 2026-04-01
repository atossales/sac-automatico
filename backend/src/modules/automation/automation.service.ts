import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { Automation } from '@prisma/client';
import type { AutomationEvent, AutomationCheckResult, UpsertAutomationData, UpdateAutomationData } from './automation.types.js';

/**
 * Verifica se alguma automação ativa deve disparar para o evento recebido.
 *
 * Ordem de prioridade:
 * 1. WELCOME — primeira mensagem do participante na conversa
 * 2. STORY_MENTION — mensagem com attachment tipo story_mention
 * 3. KEYWORD — texto contém a palavra-chave (case insensitive)
 *
 * Apenas a primeira automação que bater é disparada.
 */
export async function checkAndTrigger(
  accountId: string,
  event: AutomationEvent,
): Promise<AutomationCheckResult> {
  const noTrigger: AutomationCheckResult = {
    triggered: false,
    automationId: null,
    message: null,
    type: null,
  };

  // Busca todas as automações ativas da conta em uma única query
  const automations = await prisma.automation.findMany({
    where: { accountId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  if (automations.length === 0) {
    return noTrigger;
  }

  // 1. WELCOME — primeira mensagem do participante
  if (event.isFirstMessage) {
    const welcome = automations.find((a) => a.type === 'WELCOME');
    if (welcome) {
      logger.info(
        { accountId, automationId: welcome.id, type: 'WELCOME' },
        'Automacao WELCOME disparada',
      );
      return buildResult(welcome);
    }
  }

  // 2. STORY_MENTION — attachment tipo story_mention
  if (event.messageType === 'story_mention') {
    const storyMention = automations.find((a) => a.type === 'STORY_MENTION');
    if (storyMention) {
      logger.info(
        { accountId, automationId: storyMention.id, type: 'STORY_MENTION' },
        'Automacao STORY_MENTION disparada',
      );
      return buildResult(storyMention);
    }
  }

  // 3. KEYWORD — texto contém a palavra-chave (case insensitive)
  if (event.messageText.length > 0) {
    const normalizedText = event.messageText.toLowerCase();

    const keywordMatch = automations.find(
      (a) =>
        a.type === 'KEYWORD' &&
        a.triggerValue !== null &&
        a.triggerValue.length > 0 &&
        normalizedText.includes(a.triggerValue.toLowerCase()),
    );

    if (keywordMatch) {
      logger.info(
        { accountId, automationId: keywordMatch.id, type: 'KEYWORD', triggerValue: keywordMatch.triggerValue },
        'Automacao KEYWORD disparada',
      );
      return buildResult(keywordMatch);
    }
  }

  return noTrigger;
}

function buildResult(automation: Automation): AutomationCheckResult {
  return {
    triggered: true,
    automationId: automation.id,
    message: automation.message,
    type: automation.type,
  };
}

/**
 * Lista todas as automacoes de uma conta.
 */
export async function listAutomations(accountId: string): Promise<Automation[]> {
  return prisma.automation.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Busca uma automacao pelo ID.
 * Lanca AppError 404 se nao encontrar.
 */
export async function getAutomationById(id: string): Promise<Automation> {
  const automation = await prisma.automation.findUnique({ where: { id } });

  if (!automation) {
    throw new AppError(404, 'Automacao nao encontrada', 'AUTOMATION_NOT_FOUND');
  }

  return automation;
}

/**
 * Cria uma nova automacao.
 * Valida que KEYWORD obrigatoriamente tem triggerValue.
 */
export async function createAutomation(data: UpsertAutomationData): Promise<Automation> {
  validateAutomationData(data);

  // Para WELCOME e STORY_MENTION, verifica se ja existe uma ativa para a conta
  if (data.type === 'WELCOME' || data.type === 'STORY_MENTION') {
    const existing = await prisma.automation.findFirst({
      where: { accountId: data.accountId, type: data.type, isActive: true },
    });

    if (existing) {
      throw new AppError(
        409,
        `Ja existe uma automacao ${data.type} ativa para esta conta. Desative ou delete a existente primeiro.`,
        'AUTOMATION_DUPLICATE',
      );
    }
  }

  const automation = await prisma.automation.create({
    data: {
      accountId: data.accountId,
      type: data.type,
      triggerValue: data.type === 'KEYWORD' ? (data.triggerValue ?? null) : null,
      message: data.message,
      isActive: data.isActive ?? true,
    },
  });

  logger.info(
    { automationId: automation.id, accountId: data.accountId, type: data.type },
    'Automacao criada',
  );

  return automation;
}

/**
 * Atualiza uma automacao existente.
 */
export async function updateAutomation(
  id: string,
  data: UpdateAutomationData,
): Promise<Automation> {
  const existing = await getAutomationById(id);

  // Se estiver trocando o tipo, valida os dados novamente
  const effectiveType = data.type ?? existing.type;
  const effectiveTriggerValue = data.triggerValue !== undefined ? data.triggerValue : existing.triggerValue;

  if (effectiveType === 'KEYWORD' && (!effectiveTriggerValue || effectiveTriggerValue.length === 0)) {
    throw new AppError(
      400,
      'Automacoes do tipo KEYWORD exigem um triggerValue',
      'MISSING_TRIGGER_VALUE',
    );
  }

  // Se ativando uma WELCOME/STORY_MENTION, verifica duplicata
  const isActivating = data.isActive === true && !existing.isActive;
  if (
    isActivating &&
    (effectiveType === 'WELCOME' || effectiveType === 'STORY_MENTION')
  ) {
    const duplicate = await prisma.automation.findFirst({
      where: {
        accountId: existing.accountId,
        type: effectiveType,
        isActive: true,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new AppError(
        409,
        `Ja existe uma automacao ${effectiveType} ativa para esta conta`,
        'AUTOMATION_DUPLICATE',
      );
    }
  }

  const automation = await prisma.automation.update({
    where: { id },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.triggerValue !== undefined && {
        triggerValue: effectiveType === 'KEYWORD' ? data.triggerValue : null,
      }),
      ...(data.message !== undefined && { message: data.message }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  logger.info({ automationId: id, type: automation.type }, 'Automacao atualizada');

  return automation;
}

/**
 * Deleta uma automacao pelo ID.
 */
export async function deleteAutomation(id: string): Promise<void> {
  // Verifica se existe antes de deletar
  await getAutomationById(id);

  await prisma.automation.delete({ where: { id } });

  logger.info({ automationId: id }, 'Automacao deletada');
}

/**
 * Valida dados de automacao antes de criar.
 */
function validateAutomationData(data: UpsertAutomationData): void {
  if (data.type === 'KEYWORD') {
    if (!data.triggerValue || data.triggerValue.trim().length === 0) {
      throw new AppError(
        400,
        'Automacoes do tipo KEYWORD exigem um triggerValue',
        'MISSING_TRIGGER_VALUE',
      );
    }
  }
}
