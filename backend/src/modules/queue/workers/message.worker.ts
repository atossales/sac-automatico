import { Worker, Job } from 'bullmq';
import { createBullMQConnection } from '../../../config/redis.js';
import { prisma } from '../../../config/database.js';
import { logger } from '../../../utils/logger.js';
import { generateResponse } from '../../ai/ai.service.js';
import {
  getConversationHistory,
  upsertConversation,
  saveMessage,
  sendMessage,
  getAccountConfig,
} from '../../instagram/instagram.service.js';
import { checkAndTrigger } from '../../automation/automation.service.js';
import { humanDelay } from '../../../utils/delay.js';
import type { IncomingDmJob } from '../../instagram/instagram.types.js';

const QUEUE_NAME = 'messages';
const CONCURRENCY = 3; // Processa até 3 DMs em paralelo
const MAX_ATTEMPTS = 3; // Definido em queue.service.ts

/**
 * Mensagem de fallback quando a IA falha após todos os retries.
 * Usada apenas se a conta não tiver uma mensagem personalizada configurada.
 */
const DEFAULT_FALLBACK_MESSAGE =
  'Olá! No momento estou com alta demanda. Em breve retorno sua mensagem. 😊';

/**
 * Mensagem enviada quando o cliente envia conteúdo que não é texto
 * (imagens, áudios, vídeos, stickers, etc.)
 */
const DEFAULT_NON_TEXT_MESSAGE =
  'Recebi sua mensagem! No momento só consigo responder textos. Pode me escrever o que precisa? 😊';

let worker: Worker<IncomingDmJob> | null = null;

/**
 * Verifica se a mensagem está dentro da janela de 24h da Meta.
 * Retorna true se ainda pode responder, false caso contrário.
 */
function isWithinResponseWindow(timestamp: number): boolean {
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  return Date.now() - timestamp < TWENTY_FOUR_HOURS_MS;
}

/**
 * Envia uma mensagem de fallback quando não é possível gerar resposta via IA.
 * Aplica delay humanizado antes do envio para manter a naturalidade.
 */
async function sendFallbackMessage(
  accountId: string,
  senderId: string,
  conversationId: string,
  fallbackText: string,
  delayMin: number,
  delayMax: number,
): Promise<void> {
  await humanDelay(delayMin, delayMax);

  const sent = await sendMessage(accountId, senderId, fallbackText);

  await saveMessage(conversationId, fallbackText, 'ASSISTANT', sent.message_id);

  logger.info(
    { accountId, senderId, messageId: sent.message_id },
    'Mensagem de fallback enviada',
  );
}

/**
 * Trata mensagens não-texto (imagem, áudio, vídeo, sticker, etc.).
 * Envia uma resposta informando que só processa texto por enquanto.
 */
async function handleNonTextMessage(job: { data: IncomingDmJob; id?: string }): Promise<void> {
  const { accountId, senderId, messageId, timestamp, messageType } = job.data;

  logger.info(
    { jobId: job.id, accountId, senderId, messageId, messageType },
    'Mensagem não-texto recebida — enviando resposta informativa',
  );

  if (!isWithinResponseWindow(timestamp)) {
    logger.warn(
      { accountId, senderId, jobId: job.id },
      'Mensagem não-texto fora da janela de 24h — descartando',
    );
    return;
  }

  const conversationId = await upsertConversation(accountId, senderId);

  // Persiste registro da mensagem não-texto (com descrição do tipo)
  const nonTextDescription = `[${messageType}]`;
  await saveMessage(conversationId, nonTextDescription, 'USER', messageId);

  const accountConfig = await getAccountConfig(accountId);

  await sendFallbackMessage(
    accountId,
    senderId,
    conversationId,
    DEFAULT_NON_TEXT_MESSAGE,
    accountConfig.delayMin,
    accountConfig.delayMax,
  );
}

/**
 * Processa um DM de texto recebido:
 * 1. Persiste a mensagem do usuário
 * 2. Busca histórico da conversa (até 20 mensagens)
 * 3. Gera resposta via Gemini com system prompt da conta
 * 4. Aplica delay humanizado (3-12s)
 * 5. Envia a resposta via Graph API
 * 6. Persiste a resposta enviada
 */
async function processTextMessage(job: { data: IncomingDmJob; id?: string }): Promise<void> {
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

  // Busca configuração da conta (system prompt + delays)
  const accountConfig = await getAccountConfig(accountId);

  // Gera resposta com a IA
  logger.debug({ accountId, historyLength: historyWithoutCurrent.length }, 'Gerando resposta com Gemini');
  const { response, escalated } = await generateResponse(
    accountConfig.systemPrompt,
    historyWithoutCurrent,
    messageText,
  );

  if (escalated) {
    logger.warn(
      { accountId, senderId, jobId: job.id },
      'Resposta da IA marcada como escalada — requer atenção humana',
    );
  }

  // Aplica delay humanizado com valores configurados por conta
  const startDelay = Date.now();
  await humanDelay(accountConfig.delayMin, accountConfig.delayMax);
  const elapsed = Date.now() - startDelay;

  logger.debug({ elapsed, accountId }, 'Delay humanizado aplicado');

  // Verifica se o job não está muito atrasado (janela de 24h da Meta)
  if (!isWithinResponseWindow(timestamp)) {
    logger.warn(
      { accountId, senderId, messageAgeMs: Date.now() - timestamp, jobId: job.id },
      'Mensagem fora da janela de 24h — não enviando para evitar erro de template',
    );
    return;
  }

  // Envia a resposta via Graph API
  const sent = await sendMessage(accountId, senderId, response);

  // Persiste a resposta enviada
  await saveMessage(conversationId, response, 'ASSISTANT', sent.message_id);

  logger.info(
    { accountId, senderId, messageId: sent.message_id, escalated: escalated ?? false },
    'DM processado e resposta enviada com sucesso',
  );
}

/**
 * Verifica se alguma automacao deve disparar para esta mensagem.
 * Se disparar, envia a mensagem da automacao (com delay humanizado)
 * e retorna true — nesse caso o fluxo normal (IA) NAO deve prosseguir.
 */
async function tryAutomation(job: { data: IncomingDmJob; id?: string }): Promise<boolean> {
  const { accountId, senderId, messageId, messageText, messageType, timestamp } = job.data;

  try {
    // Verifica janela de 24h antes de qualquer coisa
    if (!isWithinResponseWindow(timestamp)) {
      return false;
    }

    // Determina se e a primeira mensagem do participante na conversa
    const existingConversation = await prisma.conversation.findFirst({
      where: { accountId, participantId: senderId },
      select: {
        id: true,
        _count: { select: { messages: true } },
      },
    });

    const isFirstMessage = !existingConversation || existingConversation._count.messages === 0;

    const result = await checkAndTrigger(accountId, {
      messageText,
      messageType,
      isFirstMessage,
    });

    if (!result.triggered || !result.message) {
      return false;
    }

    logger.info(
      {
        jobId: job.id,
        accountId,
        senderId,
        automationId: result.automationId,
        automationType: result.type,
      },
      'Automacao disparada — enviando mensagem automatica em vez de IA',
    );

    // Cria/atualiza conversa e persiste a mensagem do usuario
    const conversationId = await upsertConversation(accountId, senderId);
    const userContent = messageType === 'text' ? messageText : `[${messageType}]`;
    await saveMessage(conversationId, userContent, 'USER', messageId);

    // Aplica delay humanizado antes de enviar
    const accountConfig = await getAccountConfig(accountId);
    await humanDelay(accountConfig.delayMin, accountConfig.delayMax);

    // Envia a mensagem da automacao
    const sent = await sendMessage(accountId, senderId, result.message);
    await saveMessage(conversationId, result.message, 'ASSISTANT', sent.message_id);

    logger.info(
      { accountId, senderId, automationId: result.automationId, messageId: sent.message_id },
      'Mensagem de automacao enviada com sucesso',
    );

    return true;
  } catch (err) {
    // Se a verificacao de automacao falhar, logamos e deixamos o fluxo normal prosseguir
    logger.error(
      { err, accountId, senderId, jobId: job.id },
      'Erro ao verificar automacoes — prosseguindo com fluxo normal',
    );
    return false;
  }
}

/**
 * Router principal: direciona para o handler correto baseado no tipo de mensagem.
 * Primeiro verifica automacoes — se uma disparar, nao processa com IA.
 */
async function processMessage(job: { data: IncomingDmJob; id?: string }): Promise<void> {
  // Verifica automacoes antes de qualquer processamento
  const automationTriggered = await tryAutomation(job);
  if (automationTriggered) {
    return;
  }

  if (job.data.messageType !== 'text') {
    await handleNonTextMessage(job);
    return;
  }

  await processTextMessage(job);
}

/**
 * Handler executado quando um job falha definitivamente (esgotou todos os retries).
 * Envia mensagem de fallback ao cliente para que não fique sem resposta.
 */
async function handleFailedJob(job: Job<IncomingDmJob> | undefined, err: Error): Promise<void> {
  if (!job) {
    logger.error({ err }, 'Job falhou mas referência do job é nula');
    return;
  }

  const isFinalFailure = job.attemptsMade >= MAX_ATTEMPTS;

  logger.error(
    { jobId: job.id, err, attempt: job.attemptsMade, isFinalFailure },
    'Job falhou',
  );

  if (!isFinalFailure) return;

  // Tentativa de enviar fallback ao cliente
  const { accountId, senderId, timestamp } = job.data;

  if (!isWithinResponseWindow(timestamp)) {
    logger.warn(
      { accountId, senderId, jobId: job.id },
      'Job esgotou retries mas mensagem está fora da janela de 24h — fallback não enviado',
    );
    return;
  }

  try {
    const conversationId = await upsertConversation(accountId, senderId);
    const accountConfig = await getAccountConfig(accountId);

    // Tenta usar mensagem de fallback da config, senão usa a padrão
    const fallbackText = DEFAULT_FALLBACK_MESSAGE;

    await sendFallbackMessage(
      accountId,
      senderId,
      conversationId,
      fallbackText,
      accountConfig.delayMin,
      accountConfig.delayMax,
    );

    logger.info(
      { accountId, senderId, jobId: job.id },
      'Fallback enviado após esgotamento de retries',
    );
  } catch (fallbackErr) {
    logger.error(
      { accountId, senderId, jobId: job.id, err: fallbackErr },
      'Falha ao enviar mensagem de fallback — cliente ficou sem resposta',
    );
  }
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
    void handleFailedJob(job, err);
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
