'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { playgroundApi, accountsApi } from '@/lib/api';
import type { InstagramAccount, PlaygroundResponse } from '@/lib/api';

interface PromptPlaygroundProps {
  token: string;
}

export function PromptPlayground({ token }: PromptPlaygroundProps): JSX.Element {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void accountsApi.list(token).then((res) => {
      if (!cancelled) {
        setAccounts(res.data);
        setAccountsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setAccountsLoading(false);
    });

    return () => { cancelled = true; };
  }, [token]);

  async function handleTest(): Promise<void> {
    if (!selectedAccountId || !message.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await playgroundApi.test(token, {
        accountId: selectedAccountId,
        message: message.trim(),
      });
      setResponse(res.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar resposta.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = !selectedAccountId || !message.trim() || loading;

  return (
    <div>
      {/* Aviso de simulacao */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          borderLeft: '4px solid var(--color-warning)',
          padding: '16px',
          borderRadius: 'var(--radius)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <AlertTriangle
          size={16}
          style={{ color: 'var(--color-warning)', flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'var(--color-warning)',
          }}
        >
          Esta e uma simulacao. Nenhum DM real sera enviado.
        </span>
      </div>

      {/* Seletor de conta */}
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="playground-account"
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
            marginBottom: '6px',
          }}
        >
          Conta Instagram
        </label>
        <select
          id="playground-account"
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          disabled={accountsLoading}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            minHeight: '44px',
            outline: 'none',
            cursor: accountsLoading ? 'not-allowed' : 'pointer',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.outline = '2px solid var(--color-primary)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.outline = 'none';
          }}
        >
          <option value="" disabled>
            Selecione uma conta...
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.username}
            </option>
          ))}
        </select>
      </div>

      {/* Campo de mensagem */}
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="playground-message"
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
            marginBottom: '6px',
          }}
        >
          Mensagem de teste
        </label>
        <textarea
          id="playground-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite uma mensagem como se fosse um cliente..."
          style={{
            width: '100%',
            minHeight: '120px',
            resize: 'vertical',
            padding: '8px 16px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.6',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.outline = '2px solid var(--color-primary)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.outline = 'none';
          }}
        />
      </div>

      {/* Botao Testar resposta */}
      <button
        onClick={() => void handleTest()}
        disabled={isDisabled}
        style={{
          background: 'var(--color-primary)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 'var(--radius)',
          fontWeight: 700,
          fontSize: '0.875rem',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          minHeight: '44px',
          opacity: isDisabled ? 0.7 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = 'var(--color-primary-hover)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-primary)';
        }}
      >
        {loading && (
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
        )}
        {loading ? 'Gerando resposta...' : 'Testar resposta'}
      </button>

      {/* Area de resposta */}
      {(loading || response !== null || error !== null) && (
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            marginTop: '24px',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              marginBottom: '8px',
            }}
          >
            Resposta simulada da IA
          </label>

          {loading && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Gerando resposta...
              <span
                style={{
                  display: 'inline-block',
                  animation: 'blink 1s step-end infinite',
                  marginLeft: '2px',
                }}
              >
                |
              </span>
            </p>
          )}

          {!loading && response !== null && (
            <>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                }}
              >
                {response.response}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '16px',
                }}
              >
                Tokens: {response.tokensUsed} | Latencia: {response.latencyMs}ms
              </p>
            </>
          )}

          {!loading && error !== null && (
            <p
              role="alert"
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-error)',
              }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
