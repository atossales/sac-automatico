import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export interface AccountSummary {
  accountId: string;
  accountName: string;
  totalConversations: number;
  totalMessages: number;
  totalLinks: number;
  totalClicks: number;
}

export interface ConversationStats {
  conversationId: string;
  participantId: string;
  participantUsername: string | null;
  messageCount: number;
  lastMessageAt: Date;
}

export interface ClickTimeSeries {
  date: string;
  clicks: number;
}

/**
 * Retorna o resumo de métricas de uma conta.
 */
export async function getAccountSummary(accountId: string): Promise<AccountSummary> {
  const [account, conversationCount, messageCount, linkStats] = await Promise.all([
    prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, name: true },
    }),
    prisma.conversation.count({ where: { accountId } }),
    prisma.message.count({
      where: { conversation: { accountId } },
    }),
    prisma.trackedLink.aggregate({
      where: { accountId },
      _count: { id: true },
      _sum: { clicks: true },
    }),
  ]);

  if (!account) {
    logger.warn({ accountId }, 'Conta não encontrada para métricas');
    return {
      accountId,
      accountName: 'Conta desconhecida',
      totalConversations: 0,
      totalMessages: 0,
      totalLinks: 0,
      totalClicks: 0,
    };
  }

  return {
    accountId: account.id,
    accountName: account.name,
    totalConversations: conversationCount,
    totalMessages: messageCount,
    totalLinks: linkStats._count.id,
    totalClicks: linkStats._sum.clicks ?? 0,
  };
}

/**
 * Retorna métricas de todas as contas ativas (visão do gestor).
 */
export async function getAllAccountsSummary(): Promise<AccountSummary[]> {
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  return Promise.all(accounts.map((a) => getAccountSummary(a.id)));
}

/**
 * Retorna lista de conversas recentes de uma conta.
 */
export async function getRecentConversations(
  accountId: string,
  page = 1,
  pageSize = 20,
): Promise<{ data: ConversationStats[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { accountId },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        participantId: true,
        participantUsername: true,
        lastMessageAt: true,
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count({ where: { accountId } }),
  ]);

  return {
    data: conversations.map((c) => ({
      conversationId: c.id,
      participantId: c.participantId,
      participantUsername: c.participantUsername,
      messageCount: c._count.messages,
      lastMessageAt: c.lastMessageAt,
    })),
    total,
  };
}

/**
 * Retorna série temporal de cliques nos últimos N dias.
 */
export async function getClickTimeSeries(
  accountId: string,
  days = 30,
): Promise<ClickTimeSeries[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const clicks = await prisma.linkClick.findMany({
    where: {
      clickedAt: { gte: since },
      trackedLink: { accountId },
    },
    select: { clickedAt: true },
    orderBy: { clickedAt: 'asc' },
  });

  // Agrupa por dia
  const grouped = new Map<string, number>();

  for (const click of clicks) {
    const date = click.clickedAt.toISOString().split('T')[0] as string;
    grouped.set(date, (grouped.get(date) ?? 0) + 1);
  }

  return Array.from(grouped.entries()).map(([date, count]) => ({
    date,
    clicks: count,
  }));
}
