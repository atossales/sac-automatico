/**
 * Utilitários de autenticação do lado do cliente.
 * Tokens são armazenados em sessionStorage (sem persistência entre abas).
 */

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('auth_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('refresh_token');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem('auth_token', accessToken);
  sessionStorage.setItem('refresh_token', refreshToken);
}

export function logout(): void {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('refresh_token');
  window.location.href = '/auth/login';
}
