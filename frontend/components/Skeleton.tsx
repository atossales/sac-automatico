interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius)',
}: SkeletonProps): JSX.Element {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--color-border)',
        opacity: 0.5,
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}
