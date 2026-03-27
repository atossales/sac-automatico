import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Dashboard do Gestor — Fase 4, Módulo 6.
 *
 * Esta página será implementada completamente na Fase 4 com:
 * - Monitor de fila BullMQ em tempo real
 * - Configuração de contas e personas
 * - Playground de prompts
 * - Logs de processamento
 *
 * Por enquanto exibe o estado das contas e métricas gerais.
 */
export default function AdminDashboardPage(): JSX.Element {
  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Painel do Gestor
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Visão geral do sistema SAC Automático
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <StatusCard
          title="Contas Conectadas"
          value="—"
          description="Instagram Business ativas"
          color="var(--color-primary)"
        />
        <StatusCard
          title="Fila de Mensagens"
          value="—"
          description="Jobs aguardando processamento"
          color="var(--color-warning)"
        />
        <StatusCard
          title="Mensagens Hoje"
          value="—"
          description="DMs processados nas últimas 24h"
          color="var(--color-success)"
        />
        <StatusCard
          title="Taxa de Sucesso"
          value="—"
          description="Jobs concluídos sem falha"
          color="var(--color-success)"
        />
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
          Fase de desenvolvimento
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          O dashboard completo do gestor (M6) será implementado na Fase 4, incluindo monitor de
          fila em tempo real, configuração de personas, playground de prompts e análise de
          conversas.
        </p>
      </div>
    </div>
  );
}

interface StatusCardProps {
  title: string;
  value: string;
  description: string;
  color: string;
}

function StatusCard({ title, value, description, color }: StatusCardProps): JSX.Element {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        borderLeftWidth: '4px',
        borderLeftColor: color,
        boxShadow: 'var(--shadow)',
      }}
    >
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
        {title}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)' }}>{value}</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
        {description}
      </p>
    </div>
  );
}
