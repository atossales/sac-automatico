import { Worker } from 'bullmq';
import { createBullMQConnection } from '../../../config/redis.js';
import { logger } from '../../../utils/logger.js';
import { generateResponse } from '../../ai/ai.service.js';
import {
  getConversationHistory,
  upsertConversation,
  saveMessage,
  sendMessage,
  getSystemPrompt,
} from '../../instagram/instagram.service.js';
import { humanDelay } from '../../../utils/delay.js';
import type { IncomingDmJob } from '../../instagram/instagram.types.js';

const QUEUE_NAME = 'messages';
const CONCURRENCY = 3; // Processa até 3 DMs em paralelo

let worker: Worker<IncomingDmJob> | null = null;

/**
 * Processa um DM recebido:
 * 1. Persiste a mensagem do usuário
 * 2. Busca histórico da conversa (até 20 mensagens)
 * 3. Gera resposta via Gemini com system prompt da conta
 * 4. Aplica delay humanizado (3-12s)
 * 5. Envia a resposta via Graph API
 * 6. Persiste a resposta enviada
 */
async function processMessage(job: { data: IncomingDmJob; id?: string }): Promise<void> {
  const { accountId, senderId, messageId, messageText, timestamp } = job.data;

  logger.info(
    { jobId: job.id, accountId, senderId, messageId },
    'Iniciando processamento de DM',
  );

  // Cria ou atualiza a conversa
  const conversationId = await upsertConversation(accountId, senderId);

  // Persiste a mensagem do usuário
  await saveMessage(conversationId, messageText, 'USER', messageId);

  // Busca histórico para contexto (excluindo a mensagem que acabou de ser salva)
  const history = await getConversationHistory(conversationId, 20);
  // Remove a última mensagem (acabamos de salvar, não deve estar no histórico ainda)
  const historyWithoutCurrent = history.slice(0, -1);

  // Busca system prompt da conta
  const systemPrompt = await getSystemPrompt(accountId);

  // Gera resposta com a IA
  logger.debug({ accountId, historyLength: historyWithoutCurrent.length }, 'Gerando resposta com Gemini');
  const { response } = await generateResponse(systemPrompt, historyWithoutCurrent, messageText);

  // Aplica delay humanizado para simular digitação
  const startDelay = Date.now();
  await humanDelay();
  const elapsed = Date.now() - startDelay;

  logger.debug({ elapsed, accountId }, 'Delay humanizado aplicado');

  // Verifica se o job não está muito atrasado (janela de 24h da Meta)
  const messageAgeMs = Date.now() - timestamp;
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  if (messageAgeMs > TWENTY_FOUR_HOURS_MS) {
    logger.warn(
      { accountId, senderId, messageAgeMs, jobId: job.id },
      'Mensagem fora da janela de 24h — não enviando para evitar erro de template',
    );
    return;
  }

  // Envia a resposta via Graph API
  const sent = await sendMessage(accountId, senderId, response);

  // Persiste a resposta enviada
  await saveMessage(conversationId, response, 'ASSISTANT', sent.message_id);

  logger.info(
    { accountId, senderId, messageId: sent.message_id },
    'DM processado e resposta enviada com sucesso',
  );
}

export function startMessageWorker(): void {
  if (worker) {
    logger.warn('Worker de mensagens já está em execução');
    return;
  }

  worker = new Worker<IncomingDmJob>(
    QUEUE_NAME,
    async (job) => {
      await processMessage(job);
    },
    {
      connection: createBullMQConnection(),
      concurrency: CONCURRENCY,
      autorun: true,
    },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job concluído com sucesso');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, err, attempt: job?.attemptsMade },
      'Job falhou',
    );
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Erro no worker de mensagens');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Job travado detectado — será reprocessado');
  });

  logger.info({ queue: QUEUE_NAME, concurrency: CONCURRENCY }, 'Worker de mensagens iniciado');
}

export async function stopMessageWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Worker de mensagens encerrado');
  }
}
