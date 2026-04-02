import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../../../config/redis.js';
import { logger } from '../../../utils/logger.js';
import { generateResponse } from '../../ai/ai.service.js';
import {
  getAccountConfig,
  replyToComment,
} from '../../instagram/instagram.service.js';
import { checkAndTrigger } from '../../automation/automation.service.js';
import { humanDelay } from '../../../utils/delay.js';
import type { IncomingCommentJob } from '../../instagram/instagram.types.js';

const QUEUE_NAME = 'comments';
const CONCURRENCY = 2;
const MAX_ATTEMPTS = 3;

let worker: Worker<IncomingCommentJob> | null = null;

/**
 * Verifica se o comentario esta dentro da janela de 24h da Meta.
 */
function isWithinResponseWindow(timestamp: number): boolean {
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  return Date.now() - timestamp < TWENTY_FOUR_HOURS_MS;
}

/**
 * Verifica se alguma automacao deve disparar para este comentario.
 * Se disparar, responde com a mensagem da automacao e retorna true.
 */
async function tryCommentAutomation(job: { data: IncomingCommentJob; id?: string }): Promise<boolean> {
  const { accountId, commentId, commentText, timestamp } = job.data;

  if (!isWithinResponseWindow(timestamp)) return false;

  try {
    const result = await checkAndTrigger(accountId, {
      messageText: commentText,
      messageType: 'text',
      isFirstMessage: false, // comentarios nao tem conceito de "primeira mensagem"
    });

    if (!result.triggered || !result.message) return false;

    logger.info(
      { jobId: job.id, accountId, commentId, automationId: result.automationId, automationType: result.type },
      'Automacao disparada para comentario',
    );

    const accountConfig = await getAccountConfig(accountId);
    await humanDelay(accountConfig.delayMin, accountConfig.delayMax);

    const reply = await replyToComment(accountId, commentId, result.message);

    logger.info(
      { accountId, commentId, replyId: reply.id, automationId: result.automationId },
      'Resposta de automacao enviada para comentario',
    );

    return true;
  } catch (err) {
    logger.error(
      { err, accountId, commentId, jobId: job.id },
      'Erro ao verificar automacoes para comentario — prosseguindo com IA',
    );
    return false;
  }
}

/**
 * Processa um comentario recebido:
 * 1. Verifica automacoes (KEYWORD match) — se disparar, nao usa IA
 * 2. Busca configuracao da conta (system prompt + delays)
 * 3. Gera resposta via Gemini
 * 4. Aplica delay humanizado
 * 5. Verifica janela de 24h
 * 6. Responde ao comentario via Graph API
 */
async function processComment(job: { data: IncomingCommentJob; id?: string }): Promise<void> {
  const { accountId, commentId, commentText, senderId, senderName, timestamp, parentId } = job.data;

  logger.info(
    { jobId: job.id, accountId, commentId, senderId, parentId },
    'Iniciando processamento de comentario',
  );

  // Verifica automacoes antes de processar com IA
  const automationTriggered = await tryCommentAutomation(job);
  if (automationTriggered) return;

  // Busca configuracao da conta (system prompt + delays)
  const accountConfig = await getAccountConfig(accountId);

  // Gera resposta com a IA — comentario como mensagem do usuario
  logger.debug({ accountId, commentLength: commentText.length }, 'Gerando resposta para comentario com Gemini');
  const { response } = await generateResponse(
    accountConfig.systemPrompt,
    [], // Comentarios nao tem historico de conversa
    commentText,
  );

  // Aplica delay humanizado com valores configurados por conta
  const startDelay = Date.now();
  await humanDelay(accountConfig.delayMin, accountConfig.delayMax);
  const elapsed = Date.now() - startDelay;

  logger.debug({ elapsed, accountId }, 'Delay humanizado aplicado para comentario');

  // Verifica janela de 24h
  if (!isWithinResponseWindow(timestamp)) {
    logger.warn(
      { accountId, commentId, messageAgeMs: Date.now() - timestamp, jobId: job.id },
      'Comentario fora da janela de 24h — nao respondendo',
    );
    return;
  }

  // Responde ao comentario via Graph API
  const reply = await replyToComment(accountId, commentId, response);

  logger.info(
    { accountId, commentId, replyId: reply.id, senderName },
    'Comentario processado e resposta enviada com sucesso',
  );
}

/**
 * Handler executado quando um job de comentario falha definitivamente.
 */
async function handleFailedJob(job: Job<IncomingCommentJob> | undefined, err: Error): Promise<void> {
  if (!job) {
    logger.error({ err }, 'Job de comentario falhou mas referencia do job e nula');
    return;
  }

  const isFinalFailure = job.attemptsMade >= MAX_ATTEMPTS;

  logger.error(
    { jobId: job.id, err, attempt: job.attemptsMade, isFinalFailure },
    'Job de comentario falhou',
  );

  // Para comentarios, nao enviamos fallback — apenas logamos a falha
  if (isFinalFailure) {
    logger.warn(
      { accountId: job.data.accountId, commentId: job.data.commentId, jobId: job.id },
      'Comentario nao respondido apos esgotamento de retries',
    );
  }
}

export function startCommentWorker(): void {
  if (worker) {
    logger.warn('Worker de comentarios ja esta em execucao');
    return;
  }

  worker = new Worker<IncomingCommentJob>(
    QUEUE_NAME,
    async (job) => {
      await processComment(job);
    },
    {
      connection: createBullMQConnection(),
      concurrency: CONCURRENCY,
      autorun: true,
    },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job de comentario concluido com sucesso');
  });

  worker.on('failed', (job, err) => {
    void handleFailedJob(job, err);
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Erro no worker de comentarios');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Job de comentario travado detectado — sera reprocessado');
  });

  logger.info({ queue: QUEUE_NAME, concurrency: CONCURRENCY }, 'Worker de comentarios iniciado');
}

export async function stopCommentWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Worker de comentarios encerrado');
  }
}
