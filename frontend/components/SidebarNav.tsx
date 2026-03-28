'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Camera,
  UserCircle,
  MessageSquare,
  FileText,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/accounts', label: 'Contas', icon: Camera },
  { href: '/admin/personas', label: 'Personas', icon: UserCircle },
  { href: '/admin/playground', label: 'Playground', icon: MessageSquare },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
];

export function SidebarNav(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const sidebarContent = (
    <div
      style={{
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setIsOpen(false)}
            aria-label={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              margin: '0 8px',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: isActive ? 700 : 400,
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(51, 65, 85, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.outline = '2px solid var(--color-primary)';
              (e.currentTarget as HTMLAnchorElement).style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.outline = 'none';
            }}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          height: 'calc(100vh - 56px)',
          position: 'sticky',
          top: '56px',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          overflowY: 'auto',
        }}
        className="sidebar-desktop"
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
        style={{
          position: 'fixed',
          top: '64px',
          left: '8px',
          zIndex: 30,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '8px',
          color: 'var(--color-text)',
          cursor: 'pointer',
          display: 'none',
        }}
        className="sidebar-toggle-mobile"
      >
        <Menu size={24} />
      </button>

      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            top: '56px',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          className="sidebar-backdrop-mobile"
        />
      )}

      {/* Mobile sidebar */}
      {isOpen && (
        <aside
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            width: '240px',
            height: 'calc(100vh - 56px)',
            zIndex: 50,
            background: 'var(--color-surface)',
            boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
            overflowY: 'auto',
          }}
          className="sidebar-mobile-open"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '12px 16px 0',
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--radius)',
              }}
            >
              <X size={24} />
            </button>
          </div>
          {sidebarContent}
        </aside>
      )}

      <style>{`
        @media (max-width: 767px) {
          .sidebar-desktop {
            display: none !important;
          }
          .sidebar-toggle-mobile {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .sidebar-mobile-open,
          .sidebar-backdrop-mobile,
          .sidebar-toggle-mobile {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
