import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createHmac } from 'node:crypto';

const TEST_WEBHOOK_SECRET = 'test_webhook_secret_for_unit_tests';

beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/test';
  process.env['REDIS_URL'] = 'redis://:pass@localhost:6379';
  process.env['GEMINI_API_KEY'] = 'test_gemini_key';
  process.env['META_APP_ID'] = 'test_app_id';
  process.env['META_APP_SECRET'] = 'test_app_secret';
  process.env['META_WEBHOOK_VERIFY_TOKEN'] = 'test_verify_token_123';
  process.env['META_WEBHOOK_SECRET'] = TEST_WEBHOOK_SECRET;
  process.env['JWT_SECRET'] = 'test_jwt_secret_with_at_least_32_characters_long';
  process.env['JWT_REFRESH_SECRET'] = 'test_jwt_refresh_secret_with_at_least_32_chars';
  process.env['TOKEN_ENCRYPTION_KEY'] = 'a'.repeat(64);
  process.env['TRACKER_BASE_URL'] = 'https://test.example.com/t';
  process.env['FRONTEND_URL'] = 'http://localhost:3000';
});

describe('safeCompare', () => {
  it('deve retornar true para buffers iguais', async () => {
    const { safeCompare } = await import('../utils/crypto.js');
    const a = Buffer.from('same_value');
    const b = Buffer.from('same_value');
    expect(safeCompare(a, b)).toBe(true);
  });

  it('deve retornar false para buffers diferentes', async () => {
    const { safeCompare } = await import('../utils/crypto.js');
    const a = Buffer.from('value_one');
    const b = Buffer.from('value_two');
    expect(safeCompare(a, b)).toBe(false);
  });

  it('deve retornar false para buffers de tamanhos diferentes', async () => {
    const { safeCompare } = await import('../utils/crypto.js');
    const a = Buffer.from('short');
    const b = Buffer.from('much_longer_value');
    expect(safeCompare(a, b)).toBe(false);
  });
});

describe('HMAC signature validation', () => {
  it('deve calcular assinatura HMAC-SHA256 correta para um payload', () => {
    const payload = Buffer.from(JSON.stringify({ test: 'payload' }));
    const signature = `sha256=${createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')}`;

    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('assinaturas diferentes para payloads diferentes', () => {
    const payload1 = Buffer.from('{"event":"message"}');
    const payload2 = Buffer.from('{"event":"read"}');

    const sig1 = createHmac('sha256', TEST_WEBHOOK_SECRET).update(payload1).digest('hex');
    const sig2 = createHmac('sha256', TEST_WEBHOOK_SECRET).update(payload2).digest('hex');

    expect(sig1).not.toBe(sig2);
  });
});
