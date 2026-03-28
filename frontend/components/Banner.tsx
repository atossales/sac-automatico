'use client';

import { useEffect } from 'react';

interface BannerProps {
  type: 'success' | 'error';
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Banner({ type, message, duration, onClose }: BannerProps): JSX.Element {
  const effectiveDuration = duration ?? (type === 'success' ? 4000 : undefined);

  useEffect(() => {
    if (type === 'success' && effectiveDuration !== undefined && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, effectiveDuration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [type, effectiveDuration, onClose]);

  const color = type === 'success' ? 'var(--color-success)' : 'var(--color-error)';

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        borderRadius: 'var(--radius)',
        borderLeft: `4px solid ${color}`,
        background: type === 'success'
          ? 'rgba(34, 197, 94, 0.15)'
          : 'rgba(239, 68, 68, 0.15)',
        color,
      }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Fechar notificacao"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color,
          fontSize: '1rem',
          lineHeight: 1,
          padding: '0 0 0 16px',
          flexShrink: 0,
        }}
      >
        &#x2715;
      </button>
    </div>
  );
}
