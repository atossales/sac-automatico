'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { username: string; role: 'admin' };
}

interface ApiErrorBody {
  error: { message: string };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error?.message === 'string'
  );
}

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const body = (await res.json()) as unknown;

      if (!res.ok) {
        const message = isApiErrorBody(body)
          ? body.error.message
          : 'Erro ao autenticar. Tente novamente.';
        setError(message);
        return;
      }

      const data = body as LoginResponse;
      sessionStorage.setItem('auth_token', data.accessToken);
      sessionStorage.setItem('refresh_token', data.refreshToken);
      router.push('/admin/dashboard');
    } catch {
      setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>SAC Automático</h1>
          <p style={styles.subtitle}>Acesse o painel de gerenciamento</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="username" style={styles.label}>
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
              autoComplete="username"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              autoComplete="current-password"
              disabled={loading}
              style={styles.input}
            />
          </div>

          {error !== null && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={loading ? styles.buttonDisabled : styles.button}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: '24px',
  },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: 'var(--shadow)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  input: {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontSize: '0.95rem',
    color: 'var(--color-text)',
    outline: 'none',
    width: '100%',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--color-error)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontSize: '0.875rem',
    color: 'var(--color-error)',
  },
  button: {
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginTop: '4px',
  },
  buttonDisabled: {
    background: 'var(--color-border)',
    color: 'var(--color-text-muted)',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'not-allowed',
    width: '100%',
    marginTop: '4px',
  },
};
