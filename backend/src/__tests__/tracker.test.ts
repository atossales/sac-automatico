import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../middleware/error.middleware.js';

vi.mock('../config/database.js', () => ({
  prisma: {
    trackedLink: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    linkClick: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../config/database.js';
import {
  replaceUrlsWithTrackedLinks,
  createTrackedLink,
  registerClickAndGetUrl,
} from '../modules/tracker/tracker.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('replaceUrlsWithTrackedLinks', () => {
  it('retorna texto sem URLs inalterado', async () => {
    const text = 'Olá! Tudo bem? Me conta o que precisa.';
    const result = await replaceUrlsWithTrackedLinks('acc_1', text);
    expect(result).toBe(text);
  });

  it('substitui URL por link rastreável', async () => {
    vi.mocked(prisma.trackedLink.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.trackedLink.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.trackedLink.create).mockResolvedValue({
      id: 'link_1',
      shortCode: 'abc12345',
      accountId: 'acc_1',
      originalUrl: 'https://minha-loja.com/produto/123',
      clicks: 0,
      createdAt: new Date(),
    });

    const text = 'Acesse: https://minha-loja.com/produto/123';
    const result = await replaceUrlsWithTrackedLinks('acc_1', text);

    expect(result).toContain('https://test.example.com/t/');
    expect(result).not.toContain('https://minha-loja.com/produto/123');
  });

  it('reutiliza link existente para mesma URL (deduplicação)', async () => {
    vi.mocked(prisma.trackedLink.findFirst).mockResolvedValue({ shortCode: 'existing1' } as never);

    const text = 'Veja: https://minha-loja.com/promo';
    const result = await replaceUrlsWithTrackedLinks('acc_1', text);

    expect(result).toBe('Veja: https://test.example.com/t/existing1');
    expect(prisma.trackedLink.create).not.toHaveBeenCalled();
  });

  it('não modifica URLs do próprio tracker (evitar duplo wrap)', async () => {
    const text = 'Clique aqui: https://test.example.com/t/abc123';
    const result = await replaceUrlsWithTrackedLinks('acc_1', text);
    expect(result).toBe(text);
  });

  it('mantém URL original se criação do link rastreável falhar', async () => {
    vi.mocked(prisma.trackedLink.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.trackedLink.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.trackedLink.create).mockRejectedValue(new Error('DB connection failed'));

    const text = 'Veja: https://site.com/produto';
    const result = await replaceUrlsWithTrackedLinks('acc_1', text);

    // Deve manter URL original — never break the response
    expect(result).toBe(text);
  });
});

describe('createTrackedLink', () => {
  it('cria novo link quando não existe', async () => {
    vi.mocked(prisma.trackedLink.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.trackedLink.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.trackedLink.create).mockResolvedValue({
      id: 'link_new',
      shortCode: 'placeholder',
      accountId: 'acc_1',
      originalUrl: 'https://example.com',
      clicks: 0,
      createdAt: new Date(),
    });

    const result = await createTrackedLink('acc_1', 'https://example.com');

    // shortCode é gerado aleatoriamente (8 chars URL-safe base64)
    expect(result.shortCode).toMatch(/^[A-Za-z0-9_-]{8}$/);
    expect(result.shortUrl).toBe(`https://test.example.com/t/${result.shortCode}`);
    expect(prisma.trackedLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accountId: 'acc_1', originalUrl: 'https://example.com' }),
      }),
    );
  });

  it('retorna link existente sem criar novo', async () => {
    vi.mocked(prisma.trackedLink.findFirst).mockResolvedValue({ shortCode: 'exist123' } as never);

    const result = await createTrackedLink('acc_1', 'https://example.com');

    expect(result.shortCode).toBe('exist123');
    expect(prisma.trackedLink.create).not.toHaveBeenCalled();
  });

  it('lança AppError se não conseguir gerar shortCode único após 5 tentativas', async () => {
    vi.mocked(prisma.trackedLink.findFirst).mockResolvedValue(null);
    // Sempre retorna colisão
    vi.mocked(prisma.trackedLink.findUnique).mockResolvedValue({ id: 'collision' } as never);

    await expect(createTrackedLink('acc_1', 'https://example.com')).rejects.toThrow(AppError);
  });
});

describe('registerClickAndGetUrl', () => {
  it('registra clique e retorna URL original', async () => {
    vi.mocked(prisma.trackedLink.findUnique).mockResolvedValue({
      id: 'link_1',
      originalUrl: 'https://destino.com',
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    const url = await registerClickAndGetUrl('abc123', 'Mozilla/5.0', '127.0.0.1');

    expect(url).toBe('https://destino.com');
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('lança AppError para shortCode inexistente', async () => {
    vi.mocked(prisma.trackedLink.findUnique).mockResolvedValue(null);

    await expect(registerClickAndGetUrl('inexistente', '', '')).rejects.toThrow(AppError);
  });
});
