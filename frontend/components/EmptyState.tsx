import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  heading: string;
  body: string;
}

export function EmptyState({ icon, heading, body }: EmptyStateProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px',
        textAlign: 'center',
      }}
    >
      {icon !== undefined && (
        <div
          style={{
            width: '48px',
            height: '48px',
            color: 'var(--color-text-muted)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}
      <p
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--color-text)',
        }}
      >
        {heading}
      </p>
      <p
        style={{
          fontSize: '0.875rem',
          fontWeight: 400,
          color: 'var(--color-text-muted)',
          marginTop: '8px',
          maxWidth: '400px',
        }}
      >
        {body}
      </p>
    </div>
  );
}
