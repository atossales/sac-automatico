import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { encryptToken, decryptToken } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/error.middleware.js';
import type {
  MetaTokenExchangeResponse,
  MetaTokenRefreshResponse,
  MetaSendMessageResponse,
  MetaConversationResponse,
  ConversationMessage,
  MetaCommentReplyResponse,
} from './instagram.types.js';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';
const MAX_HISTORY_MESSAGES = 20;

/**
 * Troca um código de autorização OAuth2 por um token de acesso de longa duração.
 * O token é criptografado antes de ser salvo no banco de dados.
 */
export async function exchangeToken(
  code: string,
  redirectUri: string,
): Promise<MetaTokenExchangeResponse> {
  const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  url.searchParams.set('client_id', env.META_APP_ID);
  url.searchParams.set('client_secret', env.META_APP_SECRET);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', code);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, 'Falha ao trocar código OAuth2');
    throw new AppError(502, 'Falha ao trocar código de autorização com a Meta', 'OAUTH_EXCHANGE_FAILED');
  }

  const data = (await response.json()) as MetaTokenExchangeResponse;

  logger.info('Token OAuth2 obtido com sucesso');
  return data;
}

/**
 * Renova o token de acesso de uma conta Instagram Business antes que expire.
 *
 * Para Instagram Business via Facebook Login, o fluxo correto é:
 * GET /oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=...
 *
 * NOTA: Page Access Tokens obtidos com um User Access Token de longa duração
 * são permanentes (não expiram). Nesse caso, a renovação não é necessária.
 * Verificamos tokenExpiresAt antes de tentar renovar.
 */
export async function refreshToken(accountId: string): Promise<void> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new AppError(404, `Conta não encontrada: ${accountId}`, 'ACCOUNT_NOT_FOUND');
  }

  // Page Access Tokens permanentes não precisam de renovação
  if (!account.tokenExpiresAt) {
    logger.info(
      { accountId },
      'Token é permanente (Page Access Token sem expiração) — renovação ignorada',
    );
    return;
  }

  // Se faltam mais de 5 dias para expirar, não renova ainda
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  if (account.tokenExpiresAt.getTime() - Date.now() > fiveDaysMs) {
    logger.info(
      { accountId, expiresAt: account.tokenExpiresAt },
      'Token ainda válido por mais de 5 dias — renovação adiada',
    );
    return;
  }

  const currentToken = decryptToken(account.accessToken);

  // Endpoint correto para Facebook Login / Instagram Business tokens
  const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', env.META_APP_ID);
  url.searchParams.set('client_secret', env.META_APP_SECRET);
  url.searchParams.set('fb_exchange_token', currentToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ accountId, status: response.status, body }, 'Falha ao renovar token');
    throw new AppError(502, 'Falha ao renovar token de acesso', 'TOKEN_REFRESH_FAILED');
  }

  const data = (await response.json()) as MetaTokenRefreshResponse;
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.account.update({
    where: { id: accountId },
    data: {
      accessToken: encryptToken(data.access_token),
      tokenExpiresAt: newExpiresAt,
    },
  });

  logger.info({ accountId, expiresAt: newExpiresAt }, 'Token renovado com sucesso');
}

/**
 * Envia uma mensagem de texto para um usuário via Graph API.
 * A janela de 24 horas para resposta sem template deve ser respeitada.
 */
export async function sendMessage(
  accountId: string,
  recipientId: string,
  text: string,
): Promise<MetaSendMessageResponse> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new AppError(404, `Conta não encontrada: ${accountId}`, 'ACCOUNT_NOT_FOUND');
  }

  if (!account.isActive) {
    throw new AppError(409, `Conta desativada: ${accountId}`, 'ACCOUNT_INACTIVE');
  }

  const accessToken = decryptToken(account.accessToken);

  const body: Record<string, unknown> = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: 'RESPONSE',
  };

  const response = await fetch(`${GRAPH_API_BASE}/me/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(
      { accountId, recipientId, status: response.status, body: errorBody },
      'Falha ao enviar mensagem via Graph API',
    );
    throw new AppError(502, 'Falha ao enviar mensagem pelo Instagram', 'SEND_MESSAGE_FAILED');
  }

  const data = (await response.json()) as MetaSendMessageResponse;

  logger.info({ accountId, recipientId, messageId: data.message_id }, 'Mensagem enviada com sucesso');
  return data;
}

/**
 * Busca o histórico de conversa de um participante (últimas N mensagens).
 * Injeta no contexto da IA para manter coerência na conversa.
 */
export async function getConversationHistory(
  conversationId: string,
  limit = MAX_HISTORY_MESSAGES,
): Promise<ConversationMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { sentAt: 'desc' },
    take: limit,
    select: {
      content: true,
      role: true,
    },
  });

  // Inverte para ordem cronológica (mais antigas primeiro)
  return messages.reverse().map((m) => ({
    role: m.role === 'USER' ? 'user' : 'model',
    content: m.content,
  }));
}

/**
 * Busca ou cria um registro de conversa para um participante.
 */
export async function upsertConversation(
  accountId: string,
  participantId: string,
  participantUsername?: string,
): Promise<string> {
  const existing = await prisma.conversation.findFirst({
    where: { accountId, participantId },
    select: { id: true },
  });

  if (existing) {
    await prisma.conversation.update({
      where: { id: existing.id },
      data: { lastMessageAt: new Date() },
    });
    return existing.id;
  }

  const created = await prisma.conversation.create({
    data: {
      accountId,
      participantId,
      participantUsername: participantUsername ?? null,
      lastMessageAt: new Date(),
    },
    select: { id: true },
  });

  return created.id;
}

/**
 * Persiste uma mensagem no banco de dados.
 */
export async function saveMessage(
  conversationId: string,
  content: string,
  role: 'USER' | 'ASSISTANT',
  instagramMessageId?: string,
): Promise<void> {
  await prisma.message.create({
    data: {
      conversationId,
      content,
      role,
      sentAt: new Date(),
      messageId: instagramMessageId ?? null,
    },
  });
}

/**
 * Busca uma conta pelo ID da página do Instagram.
 * Usado para identificar qual conta recebeu a mensagem.
 */
export async function findAccountByPageId(pageId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { pageId, isActive: true },
    select: { id: true },
  });

  return account?.id ?? null;
}

/**
 * Retorna o system prompt configurado para uma conta.
 */
export async function getSystemPrompt(accountId: string): Promise<string> {
  const config = await getAccountConfig(accountId);
  return config.systemPrompt;
}

export interface AccountConfig {
  systemPrompt: string;
  delayMin: number;
  delayMax: number;
}

/**
 * Retorna a configuração de persona da conta (system prompt + delays).
 * Usada pelo worker para aplicar delay humanizado por conta.
 */
export async function getAccountConfig(accountId: string): Promise<AccountConfig> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { systemPrompt: true, delayMin: true, delayMax: true },
  });

  if (!account) {
    throw new AppError(404, `Conta não encontrada: ${accountId}`, 'ACCOUNT_NOT_FOUND');
  }

  return {
    systemPrompt: account.systemPrompt,
    delayMin: account.delayMin,
    delayMax: account.delayMax,
  };
}

/**
 * Busca todas as respostas ao webhook da Meta para verificação de token.
 */
export async function getMetaWebhookVerification(params: {
  hub_mode: string;
  hub_verify_token: string;
  hub_challenge: string;
}): Promise<string> {
  if (params.hub_mode !== 'subscribe') {
    throw new AppError(400, 'Modo de verificação inválido', 'INVALID_HUB_MODE');
  }

  if (params.hub_verify_token !== env.META_WEBHOOK_VERIFY_TOKEN) {
    logger.warn({ receivedToken: '[REDACTED]' }, 'Token de verificação do webhook inválido');
    throw new AppError(403, 'Token de verificação inválido', 'INVALID_VERIFY_TOKEN');
  }

  return params.hub_challenge;
}

/**
 * Responde publicamente a um comentário do Instagram via Graph API.
 * Endpoint: POST /{comment-id}/replies com { message, access_token }
 */
export async function replyToComment(
  accountId: string,
  commentId: string,
  text: string,
): Promise<MetaCommentReplyResponse> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new AppError(404, `Conta não encontrada: ${accountId}`, 'ACCOUNT_NOT_FOUND');
  }

  if (!account.isActive) {
    throw new AppError(409, `Conta desativada: ${accountId}`, 'ACCOUNT_INACTIVE');
  }

  const accessToken = decryptToken(account.accessToken);

  const url = new URL(`${GRAPH_API_BASE}/${commentId}/replies`);
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('message', text);

  const response = await fetch(url.toString(), {
    method: 'POST',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(
      { accountId, commentId, status: response.status, body: errorBody },
      'Falha ao responder comentário via Graph API',
    );
    throw new AppError(502, 'Falha ao responder comentário no Instagram', 'COMMENT_REPLY_FAILED');
  }

  const data = (await response.json()) as MetaCommentReplyResponse;

  logger.info(
    { accountId, commentId, replyId: data.id },
    'Resposta ao comentário enviada com sucesso',
  );

  return data;
}

export async function fetchConversationMessages(
  accountId: string,
  pageId: string,
  conversationId: string,
): Promise<MetaConversationResponse> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new AppError(404, `Conta não encontrada: ${accountId}`, 'ACCOUNT_NOT_FOUND');
  }

  const accessToken = decryptToken(account.accessToken);

  const url = new URL(`${GRAPH_API_BASE}/${pageId}/conversations/${conversationId}/messages`);
  url.searchParams.set('fields', 'id,message,from,created_time');
  url.searchParams.set('limit', String(MAX_HISTORY_MESSAGES));
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    logger.error({ accountId, status: response.status, body }, 'Falha ao buscar histórico de conversa');
    throw new AppError(502, 'Falha ao buscar histórico de conversa', 'FETCH_HISTORY_FAILED');
  }

  return (await response.json()) as MetaConversationResponse;
}
