'use client';

import { PromptPlayground } from '@/components/PromptPlayground';

export default function PlaygroundPage(): JSX.Element {
  // TODO: obter token de autenticacao
  const token = '';

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
