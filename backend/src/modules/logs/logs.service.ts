import { prisma } from '../../config/database.js';

export interface ProcessingLogEntry {
  id: string;
  accountId: string;
  accountUsername: string;
  conversationId: string;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  processingTimeMs: number;
  createdAt: string;
}

export interface LogsResult {
  data: ProcessingLogEntry[];
  total: number;
}

export interface LogsFilter {
  accountId?: string | undefined;
  status?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  page: number;
  pageSize: number;
}

/**
 * Lista mensagens ASSISTANT como proxy de logs de processamento.
 * Cada mensagem enviada pela IA representa um processamento concluído.
 * Mensagens sem conteúdo ou com erros seriam tratadas como 'error'.
 */
export async function listLogs(filter: LogsFilter): Promise<LogsResult> {
  const { accountId, startDate, endDate, page, pageSize } = filter;
  const skip = (page - 1) * pageSize;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const whereConversation: Record<string, unknown> = {};
  if (accountId) whereConversation['accountId'] = accountId;

  const whereMessage: Record<string, unknown> = {
    role: 'ASSISTANT',
    conversation: whereConversation,
  };

  if (startDate ?? endDate) {
    whereMessage['sentAt'] = dateFilter;
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: whereMessage,
      include: {
        conversation: {
          include: {
            account: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.message.count({ where: whereMessage }),
  ]);

  const data: ProcessingLogEntry[] = messages.map((msg) => ({
    id: msg.id,
    accountId: msg.conversation.account.id,
    accountUsername: msg.conversation.account.name,
    conversationId: msg.conversationId,
    status: 'success' as const,
    processingTimeMs: 0,
    createdAt: msg.sentAt.toISOString(),
  }));

  return { data, total };
}
