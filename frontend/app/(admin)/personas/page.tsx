'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { accountsApi, type InstagramAccount, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { PersonaForm } from '@/components/PersonaForm';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { Banner } from '@/components/Banner';
import { AtSign } from 'lucide-react';

export default function PersonasPage(): JSX.Element | null {
  const router = useRouter();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    accountsApi
      .list(token)
      .then((res) => setAccounts(res.data))
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Nao foi possivel carregar as contas.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return null;

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Personas
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Configure a personalidade da IA para cada conta Instagram
        </p>
      </header>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Skeleton height="400px" />
          <Skeleton height="400px" />
        </div>
      )}

      {!loading && error !== null && (
        <Banner type="error" message={error} onClose={() => setError(null)} />
      )}

      {!loading && error === null && accounts.length === 0 && (
        <EmptyState
          icon={<AtSign size={32} />}
          heading="Nenhuma conta conectada"
          body="Adicione uma conta Instagram na pagina Contas para configurar personas."
        />
      )}

      {!loading && error === null && accounts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {accounts.map((account) => (
            <PersonaForm
              key={account.id}
              accountId={account.id}
              accountUsername={account.username}
              token={token}
            />
          ))}
        </div>
      )}
    </div>
  );
}
