/**
 * Tipos da Meta Graph API v19 para webhooks e mensagens do Instagram.
 * Referência: https://developers.facebook.com/docs/messenger-platform/webhooks
 */

// ── Webhook payload ──────────────────────────────────────────

export interface MetaWebhookPayload {
  object: 'instagram' | 'page';
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  time: number;
  messaging?: MetaWebhookMessaging[];
}

export interface MetaWebhookMessaging {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: MetaWebhookMessage;
  read?: MetaWebhookRead;
  delivery?: MetaWebhookDelivery;
}

export interface MetaWebhookMessage {
  mid: string;
  text?: string;
  attachments?: MetaWebhookAttachment[];
  is_echo?: boolean;
  is_deleted?: boolean;
}

export interface MetaWebhookAttachment {
  type: 'audio' | 'file' | 'image' | 'video' | 'location' | 'fallback';
  payload: {
    url?: string;
    title?: string;
  };
}

export interface MetaWebhookRead {
  watermark: number;
}

export interface MetaWebhookDelivery {
  watermark: number;
  mids: string[];
}

// ── Graph API responses ──────────────────────────────────────

export interface MetaTokenExchangeResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface MetaTokenRefreshResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface MetaSendMessageRequest {
  recipient: { id: string };
  message: { text: string };
  messaging_type: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
}

export interface MetaSendMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface MetaConversationMessage {
  id: string;
  message: string;
  from: { id: string; name: string };
  created_time: string;
}

export interface MetaConversationResponse {
  data: MetaConversationMessage[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

// ── Tipos internos ───────────────────────────────────────────

export interface IncomingDmJob {
  accountId: string;
  senderId: string;
  recipientId: string;
  messageId: string;
  messageText: string;
  timestamp: number;
}

export interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
}
