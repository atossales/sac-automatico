'use client';

import { LogTable } from '@/components/LogTable';

export default function LogsPage(): JSX.Element {
  // TODO: obter token de autenticacao
  const token = '';

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Logs de Processamento
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Historico de processamento de mensagens do SAC
        </p>
      </header>
      <LogTable token={token} />
    </div>
  );
}
