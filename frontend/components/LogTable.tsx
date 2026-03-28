'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { logsApi, accountsApi, ApiError } from '@/lib/api';
import type { InstagramAccount, ProcessingLog } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

function StatusBadge({ status }: { status: ProcessingLog['status'] }): JSX.Element {
  const styles: Record<ProcessingLog['status'], { bg: string; color: string; label: string }> = {
    success: {
      bg: 'rgba(34, 197, 94, 0.15)',
      color: 'var(--color-success)',
      label: 'Sucesso',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.15)',
      color: 'var(--color-error)',
      label: 'Erro',
    },
    timeout: {
      bg: 'rgba(245, 158, 11, 0.15)',
      color: 'var(--color-warning)',
      label: 'Timeout',
    },
  };

  const { bg, color, label } = styles[status];

  return (
    <span
      style={{
        background: bg,
        color,
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 400,
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}

interface LogTableProps {
  token: string;
}

export function LogTable({ token }: LogTableProps): JSX.Element {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterAccountId, setFilterAccountId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Fetch contas no mount
  useEffect(() => {
    let cancelled = false;

    void accountsApi.list(token).then((res) => {
      if (!cancelled) setAccounts(res.data);
    }).catch(() => { /* ignora erro de contas */ });

    return () => { cancelled = true; };
  }, [token]);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: Parameters<typeof logsApi.list>[1] = { page, pageSize: PAGE_SIZE };
    if (filterAccountId) params.accountId = filterAccountId;
    if (filterStatus) params.status = filterStatus;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;

    void logsApi.list(token, params).then((res) => {
      setLogs(res.data);
      setTotal(res.total);
    }).catch((err: unknown) => {
      const message = err instanceof ApiError ? err.message : 'Nao foi possivel carregar os logs.';
      setError(message);
    }).finally(() => {
      setLoading(false);
    });
  }, [token, filterAccountId, filterStatus, filterStartDate, filterEndDate, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '8px 16px',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
    minHeight: '44px',
    outline: 'none',
    colorScheme: 'dark',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  function handleInputFocus(e: React.FocusEvent<HTMLSelectElement | HTMLInputElement>): void {
    e.currentTarget.style.borderColor = 'var(--color-primary)';
    e.currentTarget.style.outline = '2px solid var(--color-primary)';
    e.currentTarget.style.outlineOffset = '2px';
  }

  function handleInputBlur(e: React.FocusEvent<HTMLSelectElement | HTMLInputElement>): void {
    e.currentTarget.style.borderColor = 'var(--color-border)';
    e.currentTarget.style.outline = 'none';
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        overflowX: 'auto',
      }}
    >
      {/* Barra de filtros */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          alignItems: 'flex-end',
        }}
      >
        {/* Filtro por conta */}
        <div>
          <label
            htmlFor="log-filter-account"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
            }}
          >
            Filtrar por conta
          </label>
          <select
            id="log-filter-account"
            value={filterAccountId}
            onChange={handleFilterChange(setFilterAccountId)}
            style={{ ...selectStyle, minWidth: '180px' }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option value="">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.username}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por status */}
        <div>
          <label
            htmlFor="log-filter-status"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
            }}
          >
            Filtrar por status
          </label>
          <select
            id="log-filter-status"
            value={filterStatus}
            onChange={handleFilterChange(setFilterStatus)}
            style={{ ...selectStyle, minWidth: '140px' }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option value="">Todos</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>

        {/* Filtro por periodo */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
            }}
          >
            Periodo
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date"
              id="log-filter-start"
              value={filterStartDate}
              onChange={handleFilterChange(setFilterStartDate)}
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <input
              type="date"
              id="log-filter-end"
              value={filterEndDate}
              onChange={handleFilterChange(setFilterEndDate)}
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
        </div>
      </div>

      {/* Estado de loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array<undefined>(5)].map((_, i) => (
            <Skeleton key={i} height="44px" />
          ))}
        </div>
      )}

      {/* Estado de erro */}
      {!loading && error !== null && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--color-error)' }}>{error}</span>
          <button
            onClick={fetchLogs}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              padding: '6px 12px',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && error === null && logs.length === 0 && (
        <EmptyState
          icon={<FileText size={32} />}
          heading="Nenhum log encontrado para os filtros selecionados"
          body="Ajuste os filtros acima ou selecione um periodo maior."
        />
      )}

      {/* Tabela */}
      {!loading && error === null && logs.length > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Conta', 'Status', 'Conversa', 'Tempo', 'Data'].map((col) => (
                  <th
                    key={col}
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
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <>
                  <tr key={log.id}>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: log.status === 'error' && log.errorMessage ? 'none' : '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      @{log.accountUsername.length > 20
                        ? `${log.accountUsername.slice(0, 20)}...`
                        : log.accountUsername}
                    </td>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: log.status === 'error' && log.errorMessage ? 'none' : '1px solid var(--color-border)',
                      }}
                    >
                      <StatusBadge status={log.status} />
                    </td>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: log.status === 'error' && log.errorMessage ? 'none' : '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.conversationId.slice(0, 8)}&hellip;
                    </td>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: log.status === 'error' && log.errorMessage ? 'none' : '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {log.processingTimeMs}ms
                    </td>
                    <td
                      style={{
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        borderBottom: log.status === 'error' && log.errorMessage ? 'none' : '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dateFormatter.format(new Date(log.createdAt))}
                    </td>
                  </tr>
                  {log.status === 'error' && log.errorMessage && (
                    <tr key={`${log.id}-error`}>
                      <td
                        colSpan={5}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-error)',
                          padding: '4px 16px 8px 16px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        {log.errorMessage}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {/* Paginacao */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              gap: '8px',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: page === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Pagina {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: page === totalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.5 : 1,
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
