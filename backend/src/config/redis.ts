import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Obrigatório para BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    logger.info('Conexão Redis estabelecida');
  });

  redisClient.on('error', (err: Error) => {
    logger.error({ err }, 'Erro no cliente Redis');
  });

  redisClient.on('close', () => {
    logger.warn('Conexão Redis encerrada');
  });

  redisClient.on('reconnecting', () => {
    logger.info('Tentando reconectar ao Redis...');
  });

  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  await client.connect();
  logger.info('Redis pronto');
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Conexão Redis encerrada');
  }
}

// Conexão dedicada para BullMQ (requer configuração específica)
export function createBullMQConnection(): Redis {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
