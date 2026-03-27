/**
 * Cliente HTTP tipado para comunicação com o backend.
 * Nunca faça chamadas diretas à DB no frontend — sempre via este cliente.
 */

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
