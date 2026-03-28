'use client';

// TODO: obter token de autenticacao
import { useEffect, useState } from 'react';
import { analyticsApi, type AccountSummary, ApiError } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { AccountFilter } from '@/components/AccountFilter';
import { ClickChart } from '@/components/ClickChart';
import { ConversationTable } from '@/components/ConversationTable';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';

export default function ClientDashboardPage(): JSX.Element {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = '';

  async function fetchAccounts(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getAllSummary(token);
      setAccounts(result.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      setError('Nao foi possivel carregar os dados. Verifique a conexao e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calcula metricas agregadas ou por conta selecionada
  const selectedAccount = selectedAccountId !== null
    ? accounts.find((a) => a.accountId === selectedAccountId)
    : null;

  const totalConversations = selectedAccount !== null && selectedAccount !== undefined
    ? selectedAccount.totalConversations
    : accounts.reduce((sum, a) => sum + a.totalConversations, 0);

  const totalMessages = selectedAccount !== null && selectedAccount !== undefined
    ? selectedAccount.totalMessages
    : accounts.reduce((sum, a) => sum + a.totalMessages, 0);

  const totalClicks = selectedAccount !== null && selectedAccount !== undefined
    ? selectedAccount.totalClicks
    : accounts.reduce((sum, a) => sum + a.totalClicks, 0);

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Seus Relatorios
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
            marginTop: '4px',
          }}
        >
          Acompanhe o desempenho do atendimento automatico
        </p>
      </header>

      {error !== null && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <p
            style={{
              color: 'var(--color-error)',
              fontSize: '0.875rem',
              margin: 0,
            }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => void fetchAccounts()}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--color-error)',
              background: 'transparent',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ marginBottom: '24px' }}>
          <Skeleton height="44px" width="320px" />
        </div>
      ) : (
        accounts.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <AccountFilter
              accounts={accounts.map((a) => ({
                accountId: a.accountId,
                accountName: a.accountName,
              }))}
              selectedAccountId={selectedAccountId}
              onSelect={(id) =>
                setSelectedAccountId((prev) => (prev === id ? null : id))
              }
            />
          </div>
        )
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {loading ? (
          <>
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
          </>
        ) : (
          <>
            <MetricCard
              title="Conversas Atendidas"
              value={totalConversations.toLocaleString('pt-BR')}
            />
            <MetricCard
              title="Mensagens Respondidas"
              value={totalMessages.toLocaleString('pt-BR')}
            />
            <MetricCard
              title="Cliques em Links"
              value={totalClicks.toLocaleString('pt-BR')}
            />
            <MetricCard
              title="Contas Ativas"
              value={accounts.length.toLocaleString('pt-BR')}
            />
          </>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        {selectedAccountId !== null ? (
          <ClickChart accountId={selectedAccountId} token={token} />
        ) : (
          <EmptyState
            heading="Selecione uma conta acima para ver os dados"
            body="Clique em uma conta no filtro acima para ver o grafico de cliques e as conversas correspondentes."
          />
        )}
      </div>

      {selectedAccountId !== null && (
        <ConversationTable accountId={selectedAccountId} token={token} />
      )}
    </div>
  );
}
