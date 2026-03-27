import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] !== 'production';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  // Redacta campos sensíveis automaticamente — nunca loga tokens ou senhas
  redact: {
    paths: [
      'accessToken',
      'refreshToken',
      'password',
      'token',
      'secret',
      'authorization',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  base: {
    service: 'sac-automatico-backend',
    env: process.env['NODE_ENV'] ?? 'development',
  },
});
