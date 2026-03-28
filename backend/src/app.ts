import express from 'express';
import type { Request, Response } from 'express';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { instagramRouter } from './modules/instagram/instagram.routes.js';
import { accountsRouter } from './modules/instagram/accounts.routes.js';
import { trackerRouter } from './modules/tracker/tracker.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { queueRouter } from './modules/queue/queue.routes.js';
import { personasRouter } from './modules/personas/personas.routes.js';
import { playgroundRouter } from './modules/playground/playground.routes.js';
import { logsRouter } from './modules/logs/logs.routes.js';
import { queueService } from './modules/queue/queue.service.js';
import { startMessageWorker, stopMessageWorker } from './modules/queue/workers/message.worker.js';
import { startTokenRefreshJob } from './jobs/token-refresh.job.js';
import { logger } from './utils/logger.js';

const app = express();

// ── Preservação do body bruto para validação HMAC ────────────
// DEVE vir antes de qualquer parser de body.
// O rawBody é necessário para calcular a assinatura HMAC dos webhooks da Meta.
app.use((req, res, next) => {
  if (req.path.startsWith('/instagram/webhook') && req.method === 'POST') {
    let rawBody = Buffer.alloc(0);

    req.on('data', (chunk: Buffer) => {
      rawBody = Buffer.concat([rawBody, chunk]);
    });

    req.on('end', () => {
      (req as Request & { rawBody: Buffer }).rawBody = rawBody;
      // Agora parseia o JSON manualmente
      if (req.headers['content-type']?.includes('application/json')) {
        try {
          req.body = JSON.parse(rawBody.toString('utf8')) as unknown;
        } catch {
          req.body = {};
        }
      }
      next();
    });

    req.on('error', (err) => {
      logger.error({ err }, 'Erro ao ler body da requisição');
      next(err);
    });
  } else {
    next();
  }
});

// ── Parsers de body ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── CORS ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin === env.FRONTEND_URL) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With',
    );
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// ── Headers de segurança ─────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'sac-automatico' });
});

// ── Rotas ─────────────────────────────────────────────────────
app.use('/instagram', instagramRouter);
app.use('/instagram', accountsRouter);
app.use('/t', trackerRouter);
app.use('/analytics', analyticsRouter);
app.use('/queue', queueRouter);
app.use('/personas', personasRouter);
app.use('/playground', playgroundRouter);
app.use('/logs', logsRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: 'Rota não encontrada', code: 'NOT_FOUND' } });
});

// ── Middleware de erro centralizado (deve ser o último) ───────
app.use(errorMiddleware);

// ── Inicialização do servidor ─────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    logger.info('Iniciando servidor SAC Automático...');

    await connectDatabase();
    await connectRedis();

    startMessageWorker();
    startTokenRefreshJob();

    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Servidor iniciado');
    });

    // ── Graceful shutdown ─────────────────────────────────────
    async function shutdown(signal: string): Promise<void> {
      logger.info({ signal }, 'Sinal de encerramento recebido — finalizando servidor...');

      server.close(async () => {
        try {
          await stopMessageWorker();
          await queueService.closeQueue();
          await disconnectDatabase();
          await disconnectRedis();

          logger.info('Servidor encerrado com sucesso');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Erro durante o encerramento gracioso');
          process.exit(1);
        }
      });

      // Força encerramento após 30s se o servidor não fechar
      setTimeout(() => {
        logger.error('Encerramento forçado após timeout');
        process.exit(1);
      }, 30_000).unref();
    }

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Exceção não capturada — encerrando servidor');
      void shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Promise rejeitada sem tratamento — encerrando servidor');
      void shutdown('unhandledRejection');
    });
  } catch (err) {
    logger.error({ err }, 'Falha ao inicializar o servidor');
    process.exit(1);
  }
}

void bootstrap();

export default app;
