interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
}

export function MetricCard({ title, value, description }: MetricCardProps): JSX.Element {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        boxShadow: 'var(--shadow)',
      }}
    >
      <p
        style={{
          fontSize: '0.75rem',
          fontWeight: 400,
          color: 'var(--color-text-muted)',
          marginBottom: '8px',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--color-text)',
        }}
      >
        {value}
      </p>
      {description !== undefined && (
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
            marginTop: '4px',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
