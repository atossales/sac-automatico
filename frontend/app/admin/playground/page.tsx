'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { PromptPlayground } from '@/components/PromptPlayground';

export default function PlaygroundPage(): JSX.Element | null {
  const router = useRouter();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Playground
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Teste respostas da IA sem enviar mensagens reais
        </p>
      </header>
      <PromptPlayground token={token} />
    </div>
  );
}
