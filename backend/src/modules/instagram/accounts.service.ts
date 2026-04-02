import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { encryptToken } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { OAuthCallbackResult } from './instagram.types.js';

const INSTAGRAM_API_BASE = 'https://api.instagram.com';
const INSTAGRAM_GRAPH_BASE = 'https://graph.instagram.com';

/**
 * Troca o authorization code por um short-lived token (Instagram Login API).
 */
async function exchangeCodeForShortLivedToken(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; user_id: string }> {
  const formData = new URLSearchParams({
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(`${INSTAGRAM_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, 'Falha ao trocar código OAuth2 (Instagram Login)');
    throw new AppError(502, 'Falha ao trocar código de autorização com o Instagram', 'OAUTH_EXCHANGE_FAILED');
  }

  return (await response.json()) as { access_token: string; user_id: string };
}

/**
 * Troca o short-lived token por um long-lived token (60 dias).
 */
async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const url = new URL(`${INSTAGRAM_GRAPH_BASE}/access_token`);
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_id', env.META_APP_ID);
  url.searchParams.set('client_secret', env.META_APP_SECRET);
  url.searchParams.set('access_token', shortLivedToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, 'Falha ao trocar por token de longa duração (Instagram Login)');
    throw new AppError(502, 'Falha ao obter token de longa duração do Instagram', 'LONG_LIVED_TOKEN_FAILED');
  }

  return (await response.json()) as { access_token: string; token_type: string; expires_in: number };
}

/**
 * Busca o perfil Instagram Business do usuário autenticado.
 */
async function fetchInstagramProfile(
  accessToken: string,
): Promise<{ id: string; name: string; username: string }> {
  const url = new URL(`${INSTAGRAM_GRAPH_BASE}/me`);
  url.searchParams.set('fields', 'id,name,username');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, 'Falha ao buscar perfil Instagram Business');
    throw new AppError(502, 'Falha ao buscar dados da conta Instagram', 'FETCH_IG_USER_FAILED');
  }

  return (await response.json()) as { id: string; name: string; username: string };
}

/**
 * Handler principal do callback OAuth2 (Instagram Login API).
 *
 * Fluxo:
 * 1. Troca o authorization code por um short-lived token (api.instagram.com)
 * 2. Troca por long-lived token de 60 dias (graph.instagram.com)
 * 3. Busca perfil Instagram Business do usuário autenticado
 * 4. Criptografa o token e faz upsert no banco
 */
export async function handleOAuthCallback(code: string): Promise<OAuthCallbackResult[]> {
  const redirectUri = `${env.FRONTEND_URL}/auth/callback`;

  // 1. Code → short-lived token
  const shortLivedData = await exchangeCodeForShortLivedToken(code, redirectUri);

  // 2. Short-lived → long-lived token (60 dias)
  const longLivedData = await exchangeForLongLivedToken(shortLivedData.access_token);
  const tokenExpiresAt = new Date(Date.now() + longLivedData.expires_in * 1000);

  // 3. Busca perfil Instagram Business
  const igUser = await fetchInstagramProfile(longLivedData.access_token);

  // 4. Criptografa token e faz upsert no banco
  const encryptedToken = encryptToken(longLivedData.access_token);

  const account = await prisma.account.upsert({
    where: { instagramId: igUser.id },
    create: {
      instagramId: igUser.id,
      name: igUser.username ?? igUser.name,
      accessToken: encryptedToken,
      tokenExpiresAt,
      pageId: igUser.id, // Instagram Login: pageId = ig user ID (usado no webhook para identificar a conta)
      isActive: true,
    },
    update: {
      name: igUser.username ?? igUser.name,
      accessToken: encryptedToken,
      tokenExpiresAt,
      pageId: igUser.id,
      isActive: true,
    },
    select: {
      id: true,
      instagramId: true,
      name: true,
      pageId: true,
      tokenExpiresAt: true,
      isActive: true,
    },
  });

  logger.info(
    { accountId: account.id, instagramId: igUser.id, username: igUser.username },
    'Conta Instagram conectada via Instagram Login OAuth',
  );

  return [
    {
      id: account.id,
      instagramId: account.instagramId,
      name: account.name,
      pageId: account.pageId,
      tokenExpiresAt: account.tokenExpiresAt.toISOString(),
      isActive: account.isActive,
    },
  ];
}
