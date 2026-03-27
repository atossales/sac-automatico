import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { refreshToken } from '../modules/instagram/instagram.service.js';
import { logger } from '../utils/logger.js';

/**
 * Job de renovação automática de tokens do Instagram.
 *
 * Tokens do Instagram expiram em 60 dias.
 * Este job verifica diariamente e renova tokens que expiram em menos de 5 dias.
 * Conforme CLAUDE.md: "Renovar automaticamente a cada 55 dias."
 *
 * Agenda: todo dia às 02:00 (UTC) para minimizar impacto na carga do servidor.
 */
const CRON_SCHEDULE = '0 2 * * *';
const DAYS_BEFORE_EXPIRY_TO_REFRESH = 5;

async function refreshExpiringTokens(): Promise<void> {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + DAYS_BEFORE_EXPIRY_TO_REFRESH);

  logger.info({ threshold }, 'Verificando tokens próximos de expirar');

  const accountsToRefresh = await prisma.account.findMany({
    where: {
      isActive: true,
      tokenExpiresAt: {
        lte: threshold,
      },
    },
    select: { id: true, name: true, tokenExpiresAt: true },
  });

  if (accountsToRefresh.length === 0) {
    logger.info('Nenhum token precisa ser renovado no momento');
    return;
  }

  logger.info({ count: accountsToRefresh.length }, 'Iniciando renovação de tokens');

  const results = await Promise.allSettled(
    accountsToRefresh.map(async (account) => {
      try {
        await refreshToken(account.id);
        logger.info({ accountId: account.id, name: account.name }, 'Token renovado com sucesso');
      } catch (err) {
        logger.error(
          { err, accountId: account.id, name: account.name },
          'Falha ao renovar token — requer atenção manual',
        );
        throw err;
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  logger.info(
    { succeeded, failed, total: accountsToRefresh.length },
    'Ciclo de renovação de tokens concluído',
  );
}

export function startTokenRefreshJob(): void {
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      await refreshExpiringTokens();
    } catch (err) {
      logger.error({ err }, 'Erro inesperado no job de renovação de tokens');
    }
  });

  logger.info({ schedule: CRON_SCHEDULE }, 'Job de renovação de tokens agendado');
}
