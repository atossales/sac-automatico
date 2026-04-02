import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encryptToken } from '../utils/crypto.js';
import { AppError } from '../middleware/error.middleware.js';

vi.mock('../config/database.js', () => ({
  prisma: {
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../config/database.js';
import { refreshToken } from '../modules/instagram/instagram.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeAccount(overrides: { tokenExpiresAt?: Date } = {}) {
  return {
    id: 'acc_1',
    accessToken: encryptToken('test_token_value'),
    tokenExpiresAt: overrides.tokenExpiresAt ?? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    isActive: true,
    pageId: 'page_1',
    instagramId: 'ig_1',
    name: 'Test Account',
    systemPrompt: '',
    delayMin: 3,
    delayMax: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('refreshToken', () => {
  it('não chama a Meta API se token expira em mais de 5 dias', async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue(makeAccount() as never);

    const fetchSpy = vi.spyOn(global, 'fetch');

    await refreshToken('acc_1');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('lança AppError se a conta não existir', async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue(null);

    await expect(refreshToken('nao_existe')).rejects.toThrow(AppError);
  });

  it('chama a Meta API e atualiza o banco quando token expira em menos de 5 dias', async () => {
    const nearExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.account.findUnique).mockResolvedValue(makeAccount({ tokenExpiresAt: nearExpiry }) as never);
    vi.mocked(prisma.account.update).mockResolvedValue(makeAccount() as never);

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ access_token: 'new_long_token', token_type: 'bearer', expires_in: 5184000 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await refreshToken('acc_1');

    expect(prisma.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc_1' },
        data: expect.objectContaining({
          // Token novo deve estar criptografado (formato iv:authTag:ciphertext)
          accessToken: expect.stringMatching(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/),
        }),
      }),
    );
  });

  it('lança AppError se a Meta API retornar erro', async () => {
    const nearExpiry = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.account.findUnique).mockResolvedValue(makeAccount({ tokenExpiresAt: nearExpiry }) as never);

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('{"error":{"message":"Invalid token"}}', {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(refreshToken('acc_1')).rejects.toThrow(AppError);
  });
});
