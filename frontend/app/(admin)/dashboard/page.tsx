'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { healthApi, queueApi, type QueueStats } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { StatusCard } from '@/components/StatusCard';
import { QueueMonitor } from '@/components/QueueMonitor';
import { Skeleton } from '@/components/Skeleton';

/**
 * Dashboard do Gestor — Módulo 6.
 * Exibe status do sistema e monitor de fila BullMQ em tempo real.
 */
export default function AdminDashboardPage(): JSX.Element | null {
  const router = useRouter();
  const token = getToken();

  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    const currentToken = token;

    async function fetchInitialData(): Promise<void> {
      const [healthResult, statsResult] = await Promise.allSettled([
        healthApi.check(),
        queueApi.getStats(currentToken),
      ]);

      if (healthResult.status === 'fulfilled') {
        setHealthStatus('Sistema operacional');
      } else {
        setHealthStatus('Offline');
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data);
      } else {
        setStats({ waiting: 0, active: 0, failed: 0, completed: 0 });
      }

      setLoadingStatus(false);
    }

    void fetchInitialData();
  }, [token]);

  if (!token) return null;

  const successRate =
    stats !== null && stats.completed > 0
      ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100)
      : 0;

  const isOnline = healthStatus === 'Sistema operacional';

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          Painel do Gestor
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
            marginTop: '4px',
          }}
        >
          Visão geral do sistema SAC Automático
        </p>
      </header>

      {/* StatusCards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {loadingStatus ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height="120px" />
            ))}
          </>
        ) : (
          <>
            <StatusCard
              title="Status do Sistema"
              value={healthStatus ?? '—'}
              description="Backend API"
              borderColor={isOnline ? 'var(--color-success)' : 'var(--color-error)'}
            />
            <StatusCard
              title="Jobs Aguardando"
              value={stats !== null ? String(stats.waiting) : '—'}
              description="Na fila de processamento"
              borderColor="var(--color-warning)"
            />
            <StatusCard
              title="Jobs com Falha"
              value={stats !== null ? String(stats.failed) : '—'}
              description="Requerem atenção"
              borderColor="var(--color-error)"
            />
            <StatusCard
              title="Taxa de Sucesso"
              value={`${successRate}%`}
              description="Jobs concluídos sem falha"
              borderColor="var(--color-success)"
            />
          </>
        )}
      </div>

      {/* QueueMonitor full width */}
      <QueueMonitor token={token} />
    </div>
  );
}
