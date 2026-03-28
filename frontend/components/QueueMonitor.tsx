'use client';

import React, { useState, useEffect } from 'react';
import { queueApi, type QueueStats, type QueueJob } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';

interface QueueMonitorProps {
  token: string;
}

export function QueueMonitor({ token }: QueueMonitorProps): JSX.Element {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  async function fetchData(): Promise<void> {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        queueApi.getStats(token),
        queueApi.getJobs(token, { pageSize: 10 }),
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError(
        'Não foi possível ler o estado da fila. Verifique se o Redis está em execução.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
    const pollInterval = setInterval(() => {
      void fetchData();
    }, 10000);
    return () => clearInterval(pollInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (lastUpdated === null) return;
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    setSecondsAgo(0);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  function getStatusLabel(status: QueueJob['status']): string {
    switch (status) {
      case 'waiting': return 'Aguardando';
      case 'active': return 'Processando';
      case 'completed': return 'Concluído';
      case 'failed': return 'Falhou';
    }
  }

  function getStatusStyle(status: QueueJob['status']): React.CSSProperties {
    switch (status) {
      case 'waiting':
        return {
          background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--color-warning)',
        };
      case 'active':
        return {
          background: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--color-primary)',
        };
      case 'completed':
        return {
          background: 'rgba(34, 197, 94, 0.15)',
          color: 'var(--color-success)',
        };
      case 'failed':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--color-error)',
        };
    }
  }

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height="80px" />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: '8px' }}>
            <Skeleton height="40px" />
          </div>
        ))}
      </div>
    );
  }

  if (error !== null) {
    return (
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}
      >
        <p
          role="alert"
          style={{
            color: 'var(--color-error)',
            fontSize: '0.875rem',
            marginBottom: '16px',
          }}
        >
          {error}
        </p>
        <button
          onClick={() => { void fetchData(); }}
          style={{
            padding: '8px 16px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 700,
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          Monitor da fila
        </h2>
        {lastUpdated !== null && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
            }}
          >
            Atualizado há {secondsAgo}s
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gap: '16px',
          marginTop: '16px',
          marginBottom: '24px',
        }}
        className="queue-stats-grid"
      >
        {stats !== null && (
          <>
            {(
              [
                { key: 'waiting', label: 'Aguardando', color: 'var(--color-warning)' },
                { key: 'active', label: 'Processando', color: 'var(--color-primary)' },
                { key: 'failed', label: 'Com falha', color: 'var(--color-error)' },
                { key: 'completed', label: 'Concluídos', color: 'var(--color-success)' },
              ] as const
            ).map(({ key, label, color }) => (
              <div
                key={key}
                style={{
                  background: 'var(--color-bg)',
                  padding: '16px',
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    color: 'var(--color-text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color,
                  }}
                >
                  {stats[key].toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Jobs table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr>
              {(['ID', 'Nome', 'Status', 'Criado em'] as const).map((col) => (
                <th
                  key={col}
                  scope="col"
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    color: 'var(--color-text-muted)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '32px 12px',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  Nenhum job encontrado
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <>
                  <tr key={job.id}>
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '80px',
                      }}
                      title={job.id}
                    >
                      {job.id.slice(0, 8)}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {job.name}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          ...getStatusStyle(job.status),
                        }}
                      >
                        {getStatusLabel(job.status)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {formatter.format(new Date(job.timestamp))}
                    </td>
                  </tr>
                  {job.failedReason !== undefined && (
                    <tr key={`${job.id}-reason`}>
                      <td
                        colSpan={4}
                        style={{
                          padding: '4px 12px 12px',
                          borderBottom: '1px solid var(--color-border)',
                          fontSize: '0.75rem',
                          color: 'var(--color-error)',
                        }}
                      >
                        {job.failedReason}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .queue-stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 767px) {
          .queue-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
