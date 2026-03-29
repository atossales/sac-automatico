'use client';

import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/SidebarNav';
import { logout } from '@/lib/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Layout do painel do gestor.
 * Autenticação e proteção de rota serão implementadas em fase posterior.
 * Sidebar com 5 itens de navegação + top nav.
 */
export default function AdminLayout({ children }: AdminLayoutProps): JSX.Element {
  return (
    <div className="admin-layout">
      <nav className="admin-nav">
        <div className="admin-nav__brand">SAC Automático</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="admin-nav__badge">Gestor</div>
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
      <div className="admin-body">
        <SidebarNav />
        <main className="admin-main">{children}</main>
      </div>
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
          position: sticky;
          top: 0;
          z-index: 20;
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
          font-weight: 700;
        }
        .admin-body {
          display: flex;
          flex: 1;
          min-height: calc(100vh - 56px);
        }
        .admin-main {
          flex: 1;
          padding: 32px 24px;
          max-width: 1280px;
          width: 100%;
        }
        @media (max-width: 767px) {
          .admin-main {
            padding: 72px 16px 32px;
          }
        }
      `}</style>
    </div>
  );
}
