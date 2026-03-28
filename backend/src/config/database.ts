import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
  });

type PrismaQueryEvent = { query: string; params: string; duration: number };
type PrismaLogEvent = { message: string };

if (env.NODE_ENV === 'development') {
  (prisma.$on as (event: string, cb: (e: PrismaQueryEvent) => void) => void)(
    'query',
    (e) => {
      logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
    },
  );
}

(prisma.$on as (event: string, cb: (e: PrismaLogEvent) => void) => void)('warn', (e) => {
  logger.warn({ message: e.message }, 'Prisma warning');
});

(prisma.$on as (event: string, cb: (e: PrismaLogEvent) => void) => void)('error', (e) => {
  logger.error({ message: e.message }, 'Prisma error');
});

// Mantém instância única em desenvolvimento (evita múltiplas conexões com hot-reload)
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Conexão com o banco de dados estabelecida');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Conexão com o banco de dados encerrada');
}
