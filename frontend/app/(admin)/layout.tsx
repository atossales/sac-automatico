import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | SAC Automático — Gestor',
    default: 'Painel do Gestor',
  },
};

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Layout do painel do gestor.
 * Autenticação e proteção de rota serão implementadas na Fase 4 (M6).
 * Por enquanto, encapsula o conteúdo com a estrutura visual base.
 */
export default function AdminLayout({ children }: AdminLayoutProps): JSX.Element {
  return (
    <div className="admin-layout">
      <nav className="admin-nav">
        <div className="admin-nav__brand">SAC Automático</div>
        <div className="admin-nav__badge">Gestor</div>
      </nav>
      <main className="admin-main">{children}</main>
      <style>{`
        .admin-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-bg);
        }
        .admin-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }
        .admin-nav__brand {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--color-text);
        }
        .admin-nav__badge {
          font-size: 0.75rem;
          padding: 2px 10px;
          border-radius: 999px;
          background: var(--color-primary);
          color: white;
          font-weight: 600;
        }
        .admin-main {
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
