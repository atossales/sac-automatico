'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';

type CallbackState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

function CallbackHandler(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<CallbackState>({ status: 'loading' });

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setState({
        status: 'error',
        message: errorDescription ?? `Erro OAuth: ${error}`,
      });
      return;
    }

    if (!code) {
      setState({
        status: 'error',
        message: 'Código de autorização ausente na URL de callback.',
      });
      return;
    }

    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
    const token = sessionStorage.getItem('auth_token');

    if (!token) {
      setState({
        status: 'error',
        message: 'Sessão expirada. Faça login novamente antes de conectar uma conta.',
      });
      setTimeout(() => router.push('/auth/login'), 2000);
      return;
    }

    fetch(`${apiUrl}/instagram/oauth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as unknown;
          const message =
            typeof body === 'object' &&
            body !== null &&
            'error' in body &&
            typeof (body as { error: { message: string } }).error?.message === 'string'
              ? (body as { error: { message: string } }).error.message
              : 'Falha ao conectar conta Instagram';
          throw new ApiError(res.status, message);
        }
        setState({ status: 'success' });
        setTimeout(() => router.push('/admin/dashboard'), 2000);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Erro inesperado ao processar autenticação';
        setState({ status: 'error', message });
      });
  }, [searchParams, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow)',
        }}
      >
        {state.status === 'loading' && (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Conectando conta...</h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
              Aguarde enquanto processamos sua autorização.
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}

        {state.status === 'success' && (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '1.5rem',
              }}
            >
              ✓
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Conta conectada!</h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
              Redirecionando para o painel...
            </p>
          </>
        )}

        {state.status === 'error' && (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '1.5rem',
              }}
            >
              ✗
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Falha na autenticação</h1>
            <p
              style={{
                color: 'var(--color-text-muted)',
                marginTop: '8px',
                fontSize: '0.9rem',
                wordBreak: 'break-word',
              }}
            >
              {state.message}
            </p>
            <button
              onClick={() => router.push('/admin/dashboard')}
              style={{
                marginTop: '24px',
                padding: '10px 24px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Voltar ao painel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage(): JSX.Element {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
