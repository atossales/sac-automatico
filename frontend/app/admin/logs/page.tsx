'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { LogTable } from '@/components/LogTable';

export default function LogsPage(): JSX.Element | null {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = getToken();
    setToken(t);
    setMounted(true);
    if (!t) {
      router.push('/auth/login');
    }
  }, [router]);

  if (!mounted) return null;
  if (!token) return null;

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Logs de Processamento
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Historico de processamento de mensagens do SAC
        </p>
      </header>
      <LogTable token={token} />
    </div>
  );
}
