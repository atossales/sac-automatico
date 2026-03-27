import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/error.middleware.js';

const SHORT_CODE_LENGTH = 8;

function generateShortCode(): string {
  // Usa apenas caracteres URL-safe
  return randomBytes(6).toString('base64url').slice(0, SHORT_CODE_LENGTH);
}

/**
 * Cria um link rastreável para uma URL original.
 * Retorna a URL curta que será enviada nos DMs.
 */
export async function createTrackedLink(
  accountId: string,
  originalUrl: string,
): Promise<{ shortUrl: string; shortCode: string }> {
  // Verifica se já existe um link rastreado para essa URL nessa conta
  const existing = await prisma.trackedLink.findFirst({
    where: { accountId, originalUrl },
    select: { shortCode: true },
  });

  if (existing) {
    return {
      shortCode: existing.shortCode,
      shortUrl: `${env.TRACKER_BASE_URL}/${existing.shortCode}`,
    };
  }

  // Garante unicidade do shortCode
  let shortCode: string;
  let attempts = 0;
  const MAX_ATTEMPTS = 5;

  do {
    shortCode = generateShortCode();
    attempts++;

    if (attempts > MAX_ATTEMPTS) {
      throw new AppError(500, 'Falha ao gerar código único para o link', 'SHORT_CODE_GENERATION_FAILED');
    }

    const collision = await prisma.trackedLink.findUnique({
      where: { shortCode },
      select: { id: true },
    });

    if (!collision) break;
  } while (true);

  await prisma.trackedLink.create({
    data: {
      accountId,
      originalUrl,
      shortCode,
      clicks: 0,
    },
  });

  logger.info({ accountId, shortCode, originalUrl }, 'Link rastreável criado');

  return {
    shortCode,
    shortUrl: `${env.TRACKER_BASE_URL}/${shortCode}`,
  };
}

/**
 * Registra um clique em um link rastreável e retorna a URL original.
 * Usado pelo endpoint de redirect.
 */
export async function registerClickAndGetUrl(
  shortCode: string,
  userAgent: string,
  ip: string,
): Promise<string> {
  const link = await prisma.trackedLink.findUnique({
    where: { shortCode },
    select: { id: true, originalUrl: true },
  });

  if (!link) {
    throw new AppError(404, 'Link não encontrado', 'LINK_NOT_FOUND');
  }

  // Registra clique e incrementa contador em transação atômica
  await prisma.$transaction([
    prisma.linkClick.create({
      data: {
        trackedLinkId: link.id,
        clickedAt: new Date(),
        userAgent: userAgent || null,
        ip: ip || null,
      },
    }),
    prisma.trackedLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    }),
  ]);

  logger.info({ shortCode, ip: '[REDACTED]' }, 'Clique registrado');

  return link.originalUrl;
}

/**
 * Retorna métricas de cliques para todos os links de uma conta.
 */
export async function getLinkMetrics(accountId: string): Promise<
  Array<{
    id: string;
    originalUrl: string;
    shortCode: string;
    clicks: number;
    createdAt: Date;
  }>
> {
  return prisma.trackedLink.findMany({
    where: { accountId },
    select: {
      id: true,
      originalUrl: true,
      shortCode: true,
      clicks: true,
      createdAt: true,
    },
    orderBy: { clicks: 'desc' },
  });
}
