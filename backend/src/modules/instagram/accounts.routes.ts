import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { logger } from '../../utils/logger.js';

export const accountsRouter = Router();

accountsRouter.use(authenticate, requireRole('admin'));

const accountIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /instagram/accounts
 * Lista todas as contas ativas do banco.
 */
accountsRouter.get('/accounts', async (_req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      select: {
        id: true,
        instagramId: true,
        name: true,
        isActive: true,
        tokenExpiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const expiringThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const data = accounts.map((a) => {
      let tokenStatus: 'active' | 'expiring' | 'expired';
      if (a.tokenExpiresAt < now) {
        tokenStatus = 'expired';
      } else if (a.tokenExpiresAt < expiringThreshold) {
        tokenStatus = 'expiring';
      } else {
        tokenStatus = 'active';
      }

      return {
        id: a.id,
        igUserId: a.instagramId,
        username: a.name,
        tokenStatus,
        tokenExpiresAt: a.tokenExpiresAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
      };
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /instagram/accounts/:id
 * Soft delete — desativa a conta (isActive = false).
 */
accountsRouter.delete('/accounts/:id', async (req, res, next) => {
  try {
    const { id } = accountIdSchema.parse(req.params);

    const account = await prisma.account.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!account) {
      throw new AppError(404, 'Conta não encontrada', 'ACCOUNT_NOT_FOUND');
    }

    if (!account.isActive) {
      throw new AppError(409, 'Conta já está desativada', 'ACCOUNT_ALREADY_INACTIVE');
    }

    await prisma.account.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info({ accountId: id }, 'Conta desativada com sucesso');

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /instagram/oauth/url
 * Retorna a URL de autorização OAuth2 da Meta.
 */
accountsRouter.get('/oauth/url', (_req, res, next) => {
  try {
    const redirectUri = `${env.FRONTEND_URL}/auth/callback`;

    const oauthUrl = new URL('https://www.facebook.com/dialog/oauth');
    oauthUrl.searchParams.set('client_id', env.META_APP_ID);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set(
      'scope',
      'instagram_business_basic,instagram_business_manage_messages,instagram_manage_comments,pages_show_list',
    );
    oauthUrl.searchParams.set('response_type', 'code');

    res.json({ url: oauthUrl.toString() });
  } catch (err) {
    next(err);
  }
});
