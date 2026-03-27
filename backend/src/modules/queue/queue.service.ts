import { Queue } from 'bullmq';
import { createBullMQConnection } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { IncomingDmJob } from '../instagram/instagram.types.js';

const QUEUE_NAME = 'messages';

let messageQueue: Queue<IncomingDmJob> | null = null;

function getMessageQueue(): Queue<IncomingDmJob> {
  if (!messageQueue) {
    messageQueue = new Queue<IncomingDmJob>(QUEUE_NAME, {
      connection: createBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5_000, // 5s, 10s, 20s
        },
        removeOnComplete: {
          age: 24 * 3600, // Remove jobs completos após 24h
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Mantém falhas por 7 dias para análise
        },
      },
    });

    messageQueue.on('error', (err) => {
      logger.error({ err }, 'Erro na fila de mensagens');
    });

    logger.info({ queue: QUEUE_NAME }, 'Fila de mensagens inicializada');
  }

  return messageQueue;
}

/**
 * Adiciona um DM recebido à fila para processamento assíncrono.
 * O processamento real acontece no worker (message.worker.ts).
 */
async function addMessageJob(data: IncomingDmJob): Promise<void> {
  const queue = getMessageQueue();

  const jobId = `dm-${data.messageId}`;

  await queue.add(QUEUE_NAME, data, {
    jobId, // Idempotência — evita processar o mesmo DM duas vezes
  });

  logger.info(
    { jobId, accountId: data.accountId, senderId: data.senderId },
    'Job enfileirado com sucesso',
  );
}

async function getQueueMetrics(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getMessageQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

async function closeQueue(): Promise<void> {
  if (messageQueue) {
    await messageQueue.close();
    messageQueue = null;
    logger.info('Fila de mensagens encerrada');
  }
}

export const queueService = {
  addMessageJob,
  getQueueMetrics,
  closeQueue,
  getQueue: getMessageQueue,
};
