/**
 * Utilitários de autenticação do lado do cliente.
 * Tokens são armazenados em sessionStorage (sem persistência entre abas).
 */

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('auth_token');
}

export function logout(): void {
  sessionStorage.removeItem('auth_token');
  window.location.href = '/auth/login';
}
