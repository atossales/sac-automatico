'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, type ConversationStats } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

interface ConversationTableProps {
  accountId: string;
  token: string;
}

const PAGE_SIZE = 20;

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function ConversationTable({ accountId, token }: ConversationTableProps): JSX.Element {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ConversationStats[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function fetchData(currentPage: number): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getConversations(accountId, token, {
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setData(result.data);
      setTotal(result.total);
    } catch {
      setError('Nao foi possivel carregar os dados. Verifique a conexao e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [accountId]);

  useEffect(() => {
    void fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, page]);

  function handlePrev(): void {
    if (page > 1) setPage((p) => p - 1);
  }

  function handleNext(): void {
    if (page < totalPages) setPage((p) => p + 1);
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: '16px',
          margin: '0 0 16px 0',
        }}
      >
        Conversas recentes
      </h2>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="40px" />
          ))}
        </div>
      )}

      {!loading && error !== null && (
        <div role="alert">
          <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '8px' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => void fetchData(page)}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && error === null && data.length === 0 && (
        <EmptyState
          heading="Nenhuma conversa ainda"
          body="As conversas do Instagram aparecerao aqui assim que o sistema receber a primeira mensagem."
        />
      )}

      {!loading && error === null && data.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th
                    scope="col"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      padding: '8px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    Participante
                  </th>
                  <th
                    scope="col"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      padding: '8px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    Mensagens
                  </th>
                  <th
                    scope="col"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      padding: '8px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    Ultima atividade
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((conversation) => (
                  <tr key={conversation.conversationId}>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {conversation.participantUsername !== null
                        ? `@${conversation.participantUsername}`
                        : 'Desconhecido'}
                    </td>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {conversation.messageCount.toLocaleString('pt-BR')}
                    </td>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {formatDate(conversation.lastMessageAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
            }}
          >
            <button
              type="button"
              onClick={handlePrev}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
                fontSize: '0.875rem',
              }}
            >
              Anterior
            </button>

            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Pagina {page} de {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={page >= totalPages}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
                fontSize: '0.875rem',
              }}
            >
              Proxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
