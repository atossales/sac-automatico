'use client';

import { useState, useEffect } from 'react';
import { personasApi, ApiError } from '@/lib/api';
import { Banner } from '@/components/Banner';
import { Skeleton } from '@/components/Skeleton';

interface PersonaFormProps {
  accountId: string;
  accountUsername: string;
  token: string;
}

export function PersonaForm({ accountId, accountUsername, token }: PersonaFormProps): JSX.Element {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [delayMin, setDelayMin] = useState(3);
  const [delayMax, setDelayMax] = useState(12);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const systemPromptId = `system-prompt-${accountId}`;
  const delayMinId = `delay-min-${accountId}`;
  const delayMaxId = `delay-max-${accountId}`;

  useEffect(() => {
    personasApi
      .getByAccount(accountId, token)
      .then((res) => {
        setSystemPrompt(res.data.systemPrompt);
        setDelayMin(res.data.delayMin);
        setDelayMax(res.data.delayMax);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          // Sem persona configurada ainda — manter defaults
          return;
        }
        const message = err instanceof ApiError ? err.message : 'Nao foi possivel carregar a persona.';
        setBanner({ type: 'error', message });
      })
      .finally(() => setLoading(false));
  }, [accountId, token]);

  function handleDelayMinChange(value: number): void {
    setDelayMin(value);
    if (value > delayMax) {
      setDelayMax(value);
    }
  }

  function handleDelayMaxChange(value: number): void {
    setDelayMax(value);
    if (value < delayMin) {
      setDelayMin(value);
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      await personasApi.update(accountId, token, { systemPrompt, delayMin, delayMax });
      setBanner({ type: 'success', message: 'Persona salva com sucesso' });
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Nao foi possivel salvar a persona.';
      setBanner({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {banner !== null && (
        <div style={{ marginBottom: '16px' }}>
          <Banner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
        </div>
      )}

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}
      >
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '24px',
          }}
        >
          @{accountUsername}
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton height="200px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* System Prompt */}
            <div>
              <label
                htmlFor={systemPromptId}
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                }}
              >
                System Prompt
              </label>
              <textarea
                id={systemPromptId}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Descreva a personalidade e tom de voz do atendente..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  resize: 'vertical',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                  outline: 'none',
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

            {/* Delay Minimo */}
            <div>
              <label
                htmlFor={delayMinId}
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                }}
              >
                Delay minimo (segundos)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  id={delayMinId}
                  min={1}
                  max={10}
                  step={1}
                  value={delayMin}
                  onChange={(e) => handleDelayMinChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--color-primary)',
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text)', minWidth: '32px' }}>
                  {delayMin}s
                </span>
              </div>
            </div>

            {/* Delay Maximo */}
            <div>
              <label
                htmlFor={delayMaxId}
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                }}
              >
                Delay maximo (segundos)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  id={delayMaxId}
                  min={1}
                  max={30}
                  step={1}
                  value={delayMax}
                  onChange={(e) => handleDelayMaxChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--color-primary)',
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text)', minWidth: '32px' }}>
                  {delayMax}s
                </span>
              </div>
            </div>

            {/* Botao Salvar */}
            <div>
              <button
                onClick={() => { void handleSave(); }}
                disabled={saving}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  minHeight: '44px',
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = saving ? 'var(--color-primary)' : 'var(--color-primary)';
                }}
              >
                {saving ? 'Salvando...' : 'Salvar persona'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
