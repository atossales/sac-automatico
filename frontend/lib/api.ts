/**
 * Cliente HTTP tipado para comunicação com o backend.
 * Nunca faça chamadas diretas à DB no frontend — sempre via este cliente.
 */

import { getRefreshToken, setTokens, logout } from './auth';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Tenta renovar o access token usando o refresh token armazenado.
 * Retorna o novo access token ou null se não for possível renovar.
 * Em caso de falha, faz logout automático.
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const data = (await res.json()) as RefreshResponse;
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    logout();
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  error: {
    message: string;
    code?: string;
  };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error === 'object'
  );
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
}

async function doRequest<T>(path: string, options: RequestOptions, activeToken?: string): Promise<T> {
  const { body, token, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  const bearerToken = activeToken ?? token;
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorCode: string | undefined;

    try {
      const errorBody = (await response.json()) as unknown;
      if (isApiErrorBody(errorBody)) {
        errorMessage = errorBody.error.message;
        errorCode = errorBody.error.code;
      }
    } catch {
      // Body não é JSON — usa mensagem genérica
    }

    throw new ApiError(response.status, errorMessage, errorCode);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await doRequest<T>(path, options);
  } catch (err) {
    // Se o token expirou, tenta renovar e repetir uma vez
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      err.code === 'TOKEN_EXPIRED' &&
      options.token
    ) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        return doRequest<T>(path, options, newToken);
      }
    }
    throw err;
  }
}

// ── Analytics ─────────────────────────────────────────────────

export interface AccountSummary {
  accountId: string;
  accountName: string;
  totalConversations: number;
  totalMessages: number;
  totalLinks: number;
  totalClicks: number;
}

export interface ConversationStats {
  conversationId: string;
  participantId: string;
  participantUsername: string | null;
  messageCount: number;
  lastMessageAt: string;
}

export interface ClickTimeSeries {
  date: string;
  clicks: number;
}

export const analyticsApi = {
  getAllSummary: (token: string) =>
    request<{ data: AccountSummary[] }>('/analytics/summary', { token }),

  getAccountSummary: (accountId: string, token: string) =>
    request<{ data: AccountSummary }>(`/analytics/${accountId}/summary`, { token }),

  getConversations: (
    accountId: string,
    token: string,
    params?: { page?: number; pageSize?: number },
  ) => {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.set('page', String(params.page));
    if (params?.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ data: ConversationStats[]; total: number }>(
      `/analytics/${accountId}/conversations${query}`,
      { token },
    );
  },

  getClickTimeSeries: (accountId: string, token: string, days?: number) => {
    const query = days !== undefined ? `?days=${days}` : '';
    return request<{ data: ClickTimeSeries[] }>(
      `/analytics/${accountId}/clicks${query}`,
      { token },
    );
  },
};

// ── Health ────────────────────────────────────────────────────

export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/health'),
};

// ── Queue ────────────────────────────────────────────────────

export interface QueueStats {
  waiting: number;
  active: number;
  failed: number;
  completed: number;
}

export interface QueueJob {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  data: Record<string, unknown>;
  failedReason?: string;
  processedOn?: string;
  finishedOn?: string;
  timestamp: string;
}

export const queueApi = {
  getStats: (token: string) =>
    request<{ data: QueueStats }>('/queue/stats', { token }),

  getJobs: (token: string, params?: { status?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page !== undefined) qs.set('page', String(params.page));
    if (params?.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ data: QueueJob[]; total: number }>(`/queue/jobs${query}`, { token });
  },
};

// ── Accounts ─────────────────────────────────────────────────

export interface InstagramAccount {
  id: string;
  igUserId: string;
  username: string;
  tokenStatus: 'active' | 'expiring' | 'expired';
  tokenExpiresAt: string;
  createdAt: string;
}

export const accountsApi = {
  list: (token: string) =>
    request<{ data: InstagramAccount[] }>('/instagram/accounts', { token }),

  getOAuthUrl: (token: string) =>
    request<{ url: string }>('/instagram/oauth/url', { token }),

  remove: (accountId: string, token: string) =>
    request<void>(`/instagram/accounts/${accountId}`, { method: 'DELETE', token }),
};

// ── Personas ─────────────────────────────────────────────────

export interface Persona {
  id: string;
  accountId: string;
  systemPrompt: string;
  delayMin: number;
  delayMax: number;
  updatedAt: string;
}

export const personasApi = {
  getByAccount: (accountId: string, token: string) =>
    request<{ data: Persona }>(`/personas/${accountId}`, { token }),

  update: (accountId: string, token: string, body: { systemPrompt: string; delayMin: number; delayMax: number }) =>
    request<{ data: Persona }>(`/personas/${accountId}`, { method: 'PUT', token, body }),
};

// ── Playground ───────────────────────────────────────────────

export interface PlaygroundResponse {
  response: string;
  tokensUsed: number;
  latencyMs: number;
}

export const playgroundApi = {
  test: (token: string, body: { accountId: string; message: string }) =>
    request<{ data: PlaygroundResponse }>('/playground/test', { method: 'POST', token, body }),
};

// ── Logs ─────────────────────────────────────────────────────

export interface ProcessingLog {
  id: string;
  accountId: string;
  accountUsername: string;
  conversationId: string;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  processingTimeMs: number;
  createdAt: string;
}

export const logsApi = {
  list: (token: string, params?: { accountId?: string; status?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set('accountId', params.accountId);
    if (params?.status) qs.set('status', params.status);
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.page !== undefined) qs.set('page', String(params.page));
    if (params?.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ data: ProcessingLog[]; total: number }>(`/logs${query}`, { token });
  },
};
