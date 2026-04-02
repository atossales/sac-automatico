import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { encryptToken } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import { exchangeToken } from './instagram.service.js';
import type {
  MetaLongLivedTokenResponse,
  MetaPagesResponse,
  MetaInstagramUserResponse,
  MetaSubscribeAppResponse,
  OAuthCallbackResult,
} from './instagram.types.js';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Troca um token de curta duração por um de longa duração (60 dias).
 * O token de curta duração retornado pelo OAuth exchange dura apenas ~1h.
 */
async function exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaLongLivedTokenResponse> {
  const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', env.META_APP_ID);
  url.searchParams.set('client_secret', env.META_APP_SECRET);
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, 'Falha ao trocar por token de longa duração');
    throw new AppError(502, 'Falha ao obter token de longa duração da Meta', 'LONG_LIVED_TOKEN_FAILED');
  }

  return (await response.json()) as MetaLongLivedTokenResponse;
}

/**
 * Busca as páginas do Facebook associadas ao token de acesso.
 * Inclui o instagram_business_account vinculado a cada página.
 */
async function fetchUserPages(accessToken: string): Promise<MetaPagesResponse> {
  const url = new URL(`${GRAPH_API_BASE}/me/accounts`);
  url.searchParams.set('fields', 'id,name,access_token,instagram_business_account');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, 'Falha ao buscar páginas do usuário');
    throw new AppError(502, 'Falha ao buscar páginas do Facebook', 'FETCH_PAGES_FAILED');
  }

  return (await response.json()) as MetaPagesResponse;
}

/**
 * Busca dados do perfil Instagram Business a partir do ID da conta IG.
 */
async function fetchInstagramUser(
  igUserId: string,
  accessToken: string,
): Promise<MetaInstagramUserResponse> {
  const url = new URL(`${GRAPH_API_BASE}/${igUserId}`);
  url.searchParams.set('fields', 'id,name,username');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, 'Falha ao buscar perfil Instagram');
    throw new AppError(502, 'Falha ao buscar dados da conta Instagram', 'FETCH_IG_USER_FAILED');
  }

  return (await response.json()) as MetaInstagramUserResponse;
}

/**
 * Assina o app nos webhooks de uma Page do Facebook.
 * Obrigatório para receber DMs via webhook após conectar a conta.
 * Campos subscritos: messages, messaging_postbacks, messaging_optins.
 *
 * Falha silenciosa: se a subscrição falhar, logamos o erro mas não
 * interrompemos o fluxo — a conta é salva e o gestor pode tentar reconectar.
 */
async function subscribePageWebhook(pageId: string, pageAccessToken: string): Promise<void> {
  const url = new URL(`${GRAPH_API_BASE}/${pageId}/subscribed_apps`);
  url.searchParams.set('access_token', pageAccessToken);
  url.searchParams.set('subscribed_fields', 'messages,messaging_postbacks,messaging_optins');

  const response = await fetch(url.toString(), { method: 'POST' });

  if (!response.ok) {
    const body = await response.text();
    logger.error(
      { pageId, status: response.status, body },
      'Falha ao assinar webhook da página — DMs podem não ser recebidos',
    );
    return;
  }

  const data = (await response.json()) as MetaSubscribeAppResponse;

  if (data.success) {
    logger.info({ pageId }, 'Webhook da página assinado com sucesso');
  } else {
    logger.warn({ pageId, data }, 'Resposta de subscrição de webhook inesperada');
  }
}

/**
 * Handler principal do callback OAuth2.
 *
 * Fluxo completo:
 * 1. Troca o authorization code por um short-lived token
 * 2. Troca o short-lived token por um long-lived token (60 dias)
 * 3. Busca as páginas do Facebook associadas
 * 4. Para cada página com conta Instagram Business, busca dados do perfil IG
 * 5. Criptografa o token e faz upsert no banco (por instagramId)
 * 6. Assina os webhooks da página para receber DMs
 * 7. Retorna os dados das contas conectadas
 */
export async function handleOAuthCallback(code: string): Promise<OAuthCallbackResult[]> {
  const redirectUri = `${env.FRONTEND_URL}/auth/callback`;

  // 1. Troca code por short-lived token
  const shortLivedData = await exchangeToken(code, redirectUri);

  // 2. Troca por long-lived token
  const longLivedData = await exchangeForLongLivedToken(shortLivedData.access_token);
  const tokenExpiresAt = new Date(Date.now() + longLivedData.expires_in * 1000);

  // 3. Busca páginas do Facebook
  const pagesResponse = await fetchUserPages(longLivedData.access_token);

  if (pagesResponse.data.length === 0) {
    throw new AppError(
      400,
      'Nenhuma página do Facebook encontrada. Verifique se sua conta possui uma página vinculada.',
      'NO_PAGES_FOUND',
    );
  }

  // 4. Filtra páginas com conta Instagram Business
  const pagesWithIg = pagesResponse.data.filter(
    (page) => page.instagram_business_account?.id,
  );

  if (pagesWithIg.length === 0) {
    throw new AppError(
      400,
      'Nenhuma conta Instagram Business encontrada vinculada às suas páginas do Facebook.',
      'NO_IG_BUSINESS_ACCOUNT',
    );
  }

  // 5. Para cada página com IG Business, busca perfil e faz upsert
  const results: OAuthCallbackResult[] = [];

  for (const page of pagesWithIg) {
    const igAccountId = page.instagram_business_account!.id;

    // Busca dados do perfil Instagram
    const igUser = await fetchInstagramUser(igAccountId, page.access_token);

    // Criptografa o token da página (page access token para enviar mensagens)
    const encryptedToken = encryptToken(page.access_token);

    // Upsert: cria ou atualiza a conta no banco
    const account = await prisma.account.upsert({
      where: { instagramId: igAccountId },
      create: {
        instagramId: igAccountId,
        name: igUser.username || igUser.name,
        accessToken: encryptedToken,
        tokenExpiresAt,
        pageId: page.id,
        isActive: true,
      },
      update: {
        name: igUser.username || igUser.name,
        accessToken: encryptedToken,
        tokenExpiresAt,
        pageId: page.id,
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
      { accountId: account.id, instagramId: igAccountId, username: igUser.username },
      'Conta Instagram conectada via OAuth',
    );

    // 6. Assina webhooks da página para receber DMs (falha silenciosa)
    await subscribePageWebhook(page.id, page.access_token);

    results.push({
      id: account.id,
      instagramId: account.instagramId,
      name: account.name,
      pageId: account.pageId,
      tokenExpiresAt: account.tokenExpiresAt.toISOString(),
      isActive: account.isActive,
    });
  }

  return results;
}
