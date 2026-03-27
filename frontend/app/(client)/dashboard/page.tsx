import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Relatórios',
};

/**
 * Dashboard do Cliente — Fase 4, Módulo 5.
 *
 * Acesso read-only para o cliente acompanhar:
 * - Total de conversas e mensagens respondidas
 * - Cliques em links rastreados (com série temporal)
 * - Lista de conversas recentes (sem conteúdo das mensagens)
 *
 * Este painel será implementado completamente na Fase 4.
 */
export default function ClientDashboardPage(): JSX.Element {
  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Seus Relatórios
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Acompanhe o desempenho do atendimento automático
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <MetricCard title="Conversas Atendidas" value="—" />
        <MetricCard title="Mensagens Respondidas" value="—" />
        <MetricCard title="Cliques em Links" value="—" />
        <MetricCard title="Contas Ativas" value="—" />
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
          Em desenvolvimento
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Os relatórios completos (M5) serão disponibilizados na Fase 4, incluindo gráficos de
          cliques, lista de conversas e exportação de dados.
        </p>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
}

function MetricCard({ title, value }: MetricCardProps): JSX.Element {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        boxShadow: 'var(--shadow)',
      }}
    >
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
        {title}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)' }}>{value}</p>
    </div>
  );
}
