import { prisma } from '../../config/database.js';

export interface ProcessingLogEntry {
  id: string;
  accountId: string;
  accountUsername: string;
  conversationId: string;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  processingTimeMs: number | null;
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
/**
 * Infere o status de processamento a partir da mensagem.
 * Mensagens sem conteúdo ou com conteúdo vazio são consideradas 'error'.
 */
function inferStatus(content: string | null): ProcessingLogEntry['status'] {
  if (!content || content.trim().length === 0) return 'error';
  return 'success';
}

/**
 * Calcula o tempo de processamento em milissegundos.
 * Usa a diferença entre createdAt (registro no DB) e sentAt (timestamp da mensagem).
 * Retorna null se o cálculo não fizer sentido (negativo ou zero).
 */
function calculateProcessingTimeMs(sentAt: Date, createdAt: Date): number | null {
  const diffMs = createdAt.getTime() - sentAt.getTime();
  return diffMs > 0 ? diffMs : null;
}

export async function listLogs(filter: LogsFilter): Promise<LogsResult> {
  const { accountId, status, startDate, endDate, page, pageSize } = filter;
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

  // BUG 3 fix: Filtrar por status na query quando possível.
  // 'error' = mensagens sem conteúdo; 'success' = mensagens com conteúdo.
  if (status === 'error') {
    whereMessage['OR'] = [
      { content: '' },
      { content: null },
    ];
  } else if (status === 'success') {
    whereMessage['content'] = { not: '' };
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
    status: inferStatus(msg.content),
    processingTimeMs: calculateProcessingTimeMs(msg.sentAt, msg.createdAt),
    createdAt: msg.sentAt.toISOString(),
  }));

  return { data, total };
}
