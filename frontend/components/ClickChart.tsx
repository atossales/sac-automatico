'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi, type ClickTimeSeries } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';

interface ClickChartProps {
  accountId: string;
  token: string;
}

type DaysFilter = 7 | 30;

export function ClickChart({ accountId, token }: ClickChartProps): JSX.Element {
  const [days, setDays] = useState<DaysFilter>(7);
  const [data, setData] = useState<ClickTimeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const result = await analyticsApi.getClickTimeSeries(accountId, token, days);
        if (!cancelled) {
          setData(result.data);
        }
      } catch {
        if (!cancelled) {
          setError('Nao foi possivel carregar os dados. Verifique a conexao e tente novamente.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [accountId, days, token]);

  const daysOptions: { value: DaysFilter; label: string }[] = [
    { value: 7, label: 'Ultimos 7 dias' },
    { value: 30, label: 'Ultimos 30 dias' },
  ];

  return (
    <div
      aria-label="Grafico de cliques por dia"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Cliques por dia
        </h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          {daysOptions.map((option) => {
            const isSelected = option.value === days;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDays(option.value)}
                aria-pressed={isSelected}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  minHeight: '44px',
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--color-text-muted)',
                  border: isSelected ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <Skeleton height="240px" />}

      {!loading && error !== null && (
        <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>
      )}

      {!loading && error === null && data.length === 0 && (
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '48px 0',
          }}
        >
          Nenhum dado de cliques para o periodo selecionado
        </p>
      )}

      {!loading && error === null && data.length > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            />
            <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="var(--color-primary)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
