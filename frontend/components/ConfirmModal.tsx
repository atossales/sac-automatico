'use client';

import { useEffect, useId } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps): JSX.Element | null {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmBg =
    confirmVariant === 'danger' ? 'var(--color-error)' : 'var(--color-primary)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          maxWidth: '480px',
          width: 'calc(100% - 32px)',
          boxShadow: 'var(--shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id={titleId}
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '8px',
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
            marginBottom: '24px',
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: confirmBg,
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
