interface StatusCardProps {
  title: string;
  value: string;
  description: string;
  borderColor: string;
}

export function StatusCard({
  title,
  value,
  description,
  borderColor,
}: StatusCardProps): JSX.Element {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${borderColor}`,
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
    </div>
  );
}
