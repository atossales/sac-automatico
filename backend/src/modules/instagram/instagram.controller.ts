import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as instagramService from './instagram.service.js';
import { queueService } from '../queue/queue.service.js';
import { logger } from '../../utils/logger.js';
import type { MetaWebhookPayload, MetaWebhookMessage, IncomingDmJob } from './instagram.types.js';

/**
 * Determina o tipo de conteúdo de uma mensagem recebida pelo webhook.
 */
function resolveMessageType(message: MetaWebhookMessage): IncomingDmJob['messageType'] {
  if (message.text) return 'text';

  const attachment = message.attachments?.[0];
  if (!attachment) return 'unknown';

  const typeMap: Record<string, IncomingDmJob['messageType']> = {
    image: 'image',
    audio: 'audio',
    video: 'video',
    file: 'file',
    location: 'location',
    story_mention: 'story_mention',
  };

  return typeMap[attachment.type] ?? 'unknown';
}

const webhookVerifySchema = z.object({
  'hub.mode': z.string(),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string(),
});

/**
 * GET /instagram/webhook
 * Verifica o token de desafio enviado pela Meta ao registrar o webhook.
 */
export async function verifyWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = webhookVerifySchema.parse(req.query);

    const challenge = await instagramService.getMetaWebhookVerification({
      hub_mode: query['hub.mode'],
      hub_verify_token: query['hub.verify_token'],
      hub_challenge: query['hub.challenge'],
    });

    res.status(200).send(challenge);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /instagram/webhook
 * Recebe eventos de DM do Instagram.
 * A validação HMAC já foi feita pelo middleware validateMetaHmac.
 */
export async function receiveWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
  // Responde imediatamente para evitar timeout da Meta (máx. 20s)
  res.status(200).json({ status: 'ok' });

  try {
    const payload = req.body as MetaWebhookPayload;

    if (payload.object !== 'instagram' && payload.object !== 'page') {
      logger.warn({ object: payload.object }, 'Webhook recebido com objeto inesperado');
      return;
    }

    for (const entry of payload.entry) {
      // ── Processamento de DMs ──────────────────────────────
      for (const event of entry.messaging ?? []) {
        // Ignora eventos sem mensagem (read receipts, delivery, etc.)
        if (!event.message) continue;
        if (event.message.is_echo) {
          logger.debug({ mid: event.message.mid }, 'Echo do sistema ignorado');
          continue;
        }
        if (event.message.is_deleted) continue;

        const accountId = await instagramService.findAccountByPageId(entry.id);

        if (!accountId) {
          logger.warn({ pageId: entry.id }, 'Nenhuma conta ativa encontrada para a página');
          continue;
        }

        // Identificar loop: remetente é a própria página
        if (event.sender.id === entry.id) {
          logger.debug({ pageId: entry.id }, 'Mensagem enviada pela própria página — ignorada');
          continue;
        }

        // Determinar tipo de mensagem recebida
        const messageType = resolveMessageType(event.message);

        logger.info(
          {
            accountId,
            senderId: event.sender.id,
            messageId: event.message.mid,
            messageType,
          },
          'DM recebido, enfileirando para processamento',
        );

        await queueService.addMessageJob({
          accountId,
          senderId: event.sender.id,
          recipientId: event.recipient.id,
          messageId: event.message.mid,
          messageText: event.message.text ?? '',
          timestamp: event.timestamp,
          messageType,
        });
      }

      // ── Processamento de comentários ────────────────────────
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field !== 'comments') continue;

          const value = change.value;

          const commentAccountId = await instagramService.findAccountByPageId(entry.id);

          if (!commentAccountId) {
            logger.warn({ pageId: entry.id }, 'Nenhuma conta ativa encontrada para comentário');
            continue;
          }

          // Ignorar comentários do próprio sistema (loop prevention)
          if (value.from.id === entry.id) {
            logger.debug({ pageId: entry.id, commentId: value.id }, 'Comentário próprio ignorado');
            continue;
          }

          logger.info(
            {
              accountId: commentAccountId,
              commentId: value.id,
              senderId: value.from.id,
              mediaId: value.media.id,
            },
            'Comentário recebido, enfileirando para processamento',
          );

          const senderName = value.from.name ?? value.from.username;
          await queueService.addCommentJob({
            accountId: commentAccountId,
            commentId: value.id,
            commentText: value.text,
            mediaId: value.media.id,
            senderId: value.from.id,
            ...(senderName !== undefined && { senderName }),
            timestamp: value.timestamp,
            ...(value.parent_id !== undefined && { parentId: value.parent_id }),
          });
        }
      }
    }
  } catch (err) {
    // Não chama next(err) pois já respondeu 200 — loga o erro internamente
    logger.error({ err }, 'Erro ao processar payload do webhook');
  }
}
