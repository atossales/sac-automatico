import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logger } from '../../utils/logger.js';

export interface PersonaData {
  id: string;
  accountId: string;
  systemPrompt: string;
  delayMin: number;
  delayMax: number;
  updatedAt: string;
}

export interface PersonaDefaults {
  systemPrompt: string;
  delayMin: number;
  delayMax: number;
}

const DEFAULT_PERSONA: PersonaDefaults = {
  systemPrompt: '',
  delayMin: 3,
  delayMax: 12,
};

/**
 * Busca a persona (configuração de IA) de uma conta.
 * Se a conta não existir, lança 404.
 * Retorna os campos de persona do Account.
 */
export async function getPersona(accountId: string): Promise<PersonaData | PersonaDefaults> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      systemPrompt: true,
      delayMin: true,
      delayMax: true,
      updatedAt: true,
    },
  });

  if (!account) {
    // Retorna defaults quando conta não encontrada (comportamento definido na spec)
    return DEFAULT_PERSONA;
  }

  return {
    id: account.id,
    accountId,
    systemPrompt: account.systemPrompt,
    delayMin: account.delayMin,
    delayMax: account.delayMax,
    updatedAt: account.updatedAt.toISOString(),
  };
}

/**
 * Atualiza a persona de uma conta (upsert).
 * Valida que a conta existe antes de atualizar.
 */
export async function upsertPersona(
  accountId: string,
  data: { systemPrompt: string; delayMin: number; delayMax: number },
): Promise<PersonaData> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true },
  });

  if (!account) {
    throw new AppError(404, 'Conta não encontrada', 'ACCOUNT_NOT_FOUND');
  }

  const updated = await prisma.account.update({
    where: { id: accountId },
    data: {
      systemPrompt: data.systemPrompt,
      delayMin: data.delayMin,
      delayMax: data.delayMax,
    },
    select: {
      id: true,
      systemPrompt: true,
      delayMin: true,
      delayMax: true,
      updatedAt: true,
    },
  });

  logger.info({ accountId }, 'Persona atualizada com sucesso');

  return {
    id: updated.id,
    accountId,
    systemPrompt: updated.systemPrompt,
    delayMin: updated.delayMin,
    delayMax: updated.delayMax,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
