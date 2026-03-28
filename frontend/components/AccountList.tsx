'use client';

import { useState, useEffect } from 'react';
import { Plus, AtSign } from 'lucide-react';
import { accountsApi, type InstagramAccount, ApiError } from '@/lib/api';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { ConfirmModal } from '@/components/ConfirmModal';

interface AccountListProps {
  token: string;
}

function getDaysUntilExpiry(tokenExpiresAt: string): number {
  return Math.ceil((new Date(tokenExpiresAt).getTime() - Date.now()) / 86400000);
}

function TokenBadge({ status, tokenExpiresAt }: { status: InstagramAccount['tokenStatus']; tokenExpiresAt: string }): JSX.Element {
  if (status === 'active') {
    return (
      <span
        style={{
          background: 'rgba(34, 197, 94, 0.15)',
          color: 'var(--color-success)',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '0.75rem',
          marginLeft: '8px',
        }}
      >
        Token ativo
      </span>
    );
  }

  if (status === 'expiring') {
    const days = getDaysUntilExpiry(tokenExpiresAt);
    return (
      <span
        style={{
          background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--color-warning)',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '0.75rem',
          marginLeft: '8px',
        }}
      >
        Expira em {days} dias
      </span>
    );
  }

  return (
    <span
      style={{
        background: 'rgba(239, 68, 68, 0.15)',
        color: 'var(--color-error)',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        marginLeft: '8px',
      }}
    >
      Token expirado
    </span>
  );
}

export function AccountList({ token }: AccountListProps): JSX.Element {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    accountsApi
      .list(token)
      .then((res) => setAccounts(res.data))
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Nao foi possivel carregar as contas.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleConnectOAuth(): Promise<void> {
    try {
      const res = await accountsApi.getOAuthUrl(token);
      window.location.href = res.url;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Nao foi possivel iniciar o fluxo OAuth.';
      setBanner({ type: 'error', message });
    }
  }

  async function handleConfirmRemove(): Promise<void> {
    if (!removingId) return;
    setRemoveLoading(true);
    try {
      await accountsApi.remove(removingId, token);
      setAccounts((prev) => prev.filter((a) => a.id !== removingId));
      setBanner({ type: 'success', message: 'Conta removida com sucesso' });
      setRemovingId(null);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Nao foi possivel remover a conta.';
      setBanner({ type: 'error', message });
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <div>
      {banner !== null && (
        <div style={{ marginBottom: '16px' }}>
          <Banner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {loading ? '' : `${accounts.length} conta${accounts.length !== 1 ? 's' : ''} conectada${accounts.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => { void handleConnectOAuth(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            minHeight: '44px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)';
          }}
        >
          <Plus size={16} />
          Conectar conta Instagram
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </div>
      )}

      {!loading && error !== null && (
        <Banner type="error" message={error} onClose={() => setError(null)} />
      )}

      {!loading && error === null && accounts.length === 0 && (
        <EmptyState
          icon={<AtSign size={32} />}
          heading="Nenhuma conta conectada"
          body="Clique em 'Conectar conta Instagram' para adicionar a primeira conta Business."
        />
      )}

      {!loading && error === null && accounts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {accounts.map((account) => (
            <div
              key={account.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                  }}
                >
                  @{account.username}
                </span>
                <TokenBadge status={account.tokenStatus} tokenExpiresAt={account.tokenExpiresAt} />
              </div>
              <button
                onClick={() => setRemovingId(account.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-error)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                Remover conta
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={removingId !== null}
        title="Remover conta"
        message="Tem certeza que deseja remover esta conta? Esta acao desconecta a conta Instagram e apaga a persona configurada. Esta acao nao pode ser desfeita."
        confirmLabel="Sim, remover"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        loading={removeLoading}
        onConfirm={() => { void handleConfirmRemove(); }}
        onCancel={() => setRemovingId(null)}
      />
    </div>
  );
}
