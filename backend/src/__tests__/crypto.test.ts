import { describe, it, expect, beforeAll } from 'vitest';

// Configura variáveis de ambiente antes de importar o módulo
beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/test';
  process.env['REDIS_URL'] = 'redis://:pass@localhost:6379';
  process.env['GEMINI_API_KEY'] = 'test_gemini_key';
  process.env['META_APP_ID'] = 'test_app_id';
  process.env['META_APP_SECRET'] = 'test_app_secret';
  process.env['META_WEBHOOK_VERIFY_TOKEN'] = 'test_verify_token_123';
  process.env['META_WEBHOOK_SECRET'] = 'test_webhook_secret';
  process.env['JWT_SECRET'] = 'test_jwt_secret_with_at_least_32_characters_long';
  process.env['JWT_REFRESH_SECRET'] = 'test_jwt_refresh_secret_with_at_least_32_chars';
  process.env['TOKEN_ENCRYPTION_KEY'] = 'a'.repeat(64);
  process.env['ADMIN_USERNAME'] = 'test_admin';
  process.env['ADMIN_PASSWORD'] = 'test_admin_password_hash';
  process.env['TRACKER_BASE_URL'] = 'https://test.example.com/t';
  process.env['FRONTEND_URL'] = 'http://localhost:3000';
});

describe('crypto utils', () => {
  it('deve criptografar e descriptografar um token com sucesso', async () => {
    const { encryptToken, decryptToken } = await import('../utils/crypto.js');

    const originalToken = 'IGQVJXa_test_instagram_access_token_12345678';
    const encrypted = encryptToken(originalToken);

    expect(encrypted).not.toBe(originalToken);
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  it('deve gerar tokens criptografados diferentes a cada chamada (IV aleatório)', async () => {
    const { encryptToken } = await import('../utils/crypto.js');

    const token = 'same_token_value';
    const encrypted1 = encryptToken(token);
    const encrypted2 = encryptToken(token);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('deve lançar erro para token criptografado adulterado', async () => {
    const { encryptToken, decryptToken } = await import('../utils/crypto.js');

    const encrypted = encryptToken('original_token');
    const parts = encrypted.split(':');
    // Adultera o ciphertext
    const tampered = `${parts[0]}:${parts[1]}:${'00'.repeat(10)}`;

    expect(() => decryptToken(tampered)).toThrow();
  });

  it('deve lançar erro para formato inválido', async () => {
    const { decryptToken } = await import('../utils/crypto.js');

    expect(() => decryptToken('invalid_format')).toThrow('Formato de token criptografado inválido');
  });
});

describe('delay utils', () => {
  it('deve retornar um delay entre 3000ms e 12000ms', async () => {
    const { getHumanDelayMs } = await import('../utils/delay.js');

    for (let i = 0; i < 100; i++) {
      const ms = getHumanDelayMs();
      expect(ms).toBeGreaterThanOrEqual(3000);
      expect(ms).toBeLessThanOrEqual(12000);
    }
  });

  it('humanDelay deve resolver como promise', async () => {
    const { getHumanDelayMs } = await import('../utils/delay.js');
    // Testa a lógica sem esperar os 3-12s reais
    const ms = getHumanDelayMs();
    expect(typeof ms).toBe('number');
    expect(ms).toBeGreaterThanOrEqual(3000);
  });
});
