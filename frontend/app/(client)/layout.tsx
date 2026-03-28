'use client';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { logout } from '@/lib/auth';

// metadata só funciona em Server Components — mantido como referência mas não exportado
// quando o layout for convertido de volta para Server Component
const _metadata: Metadata = {
  title: {
    template: '%s | SAC Automático — Relatórios',
    default: 'Relatórios',
  },
};

interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * Layout do painel do cliente (read-only).
 * O cliente acessa apenas métricas e conversas, sem capacidade de configurar.
 */
export default function ClientLayout({ children }: ClientLayoutProps): JSX.Element {
  return (
    <div className="client-layout">
      <nav className="client-nav">
        <div className="client-nav__brand">SAC Automático</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="client-nav__badge">Relatórios</div>
          <button
            onClick={logout}
            style={{
              fontSize: '0.8rem',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Sair
          </button>
        </div>
      </nav>
      <main className="client-main">{children}</main>
      <style>{`
        .client-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-bg);
        }
        .client-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }
        .client-nav__brand {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--color-text);
        }
        .client-nav__badge {
          font-size: 0.75rem;
          padding: 2px 10px;
          border-radius: 999px;
          background: #0ea5e9;
          color: white;
          font-weight: 600;
        }
        .client-main {
          flex: 1;
          padding: 32px 24px;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
