'use client';

import { AccountList } from '@/components/AccountList';

export default function AccountsPage(): JSX.Element {
  // TODO: obter token de autenticacao
  const token = '';

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Contas Instagram
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Gerencie as contas Business conectadas ao SAC Automatico
        </p>
      </header>
      <AccountList token={token} />
    </div>
  );
}
