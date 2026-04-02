import { describe, it, expect, vi } from 'vitest';

// jsonwebtoken → semver → incompatibilidade CJS no Node 24.
// Todos os valores são definidos DENTRO do factory (vi.mock é hoistado para o topo).
vi.mock('jsonwebtoken', () => {
  class JWTError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JsonWebTokenError';
    }
  }
  class JWTExpiredError extends JWTError {
    constructor() {
      super('jwt expired');
      this.name = 'TokenExpiredError';
    }
  }

  let counter = 0;

  const verify = (token: string) => {
    if (!String(token).startsWith('mocked.jwt.token.')) {
      throw new JWTError('invalid signature');
    }
    return { sub: 'admin', role: 'admin' };
  };
  const sign = () => `mocked.jwt.token.${++counter}`;

  return {
    default: { sign, verify, JsonWebTokenError: JWTError, TokenExpiredError: JWTExpiredError },
    sign,
    verify,
    JsonWebTokenError: JWTError,
    TokenExpiredError: JWTExpiredError,
  };
});

// bcryptjs também tem issue com semver em Node 24
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(async (plain: string, hash: string) =>
      plain === 'password123' && hash.startsWith('$2b$'),
    ),
  },
  compare: vi.fn(async (plain: string, hash: string) =>
    plain === 'password123' && hash.startsWith('$2b$'),
  ),
}));

import { login, refreshAccessToken } from '../modules/auth/auth.service.js';
import { AppError } from '../middleware/error.middleware.js';

describe('login', () => {
  it('retorna tokens com credenciais válidas', async () => {
    const result = await login('admin', 'password123');

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.expiresIn).toBe(900);
    expect(result.user.role).toBe('admin');
    expect(result.user.username).toBe('admin');
  });

  it('lança AppError com senha incorreta', async () => {
    await expect(login('admin', 'senha_errada')).rejects.toThrow(AppError);
  });

  it('lança AppError com usuário incorreto', async () => {
    await expect(login('hacker', 'password123')).rejects.toThrow(AppError);
  });
});

describe('refreshAccessToken', () => {
  it('emite novo par de tokens com refresh token válido', async () => {
    const loginResult = await login('admin', 'password123');
    const refreshResult = refreshAccessToken(loginResult.refreshToken);

    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.refreshToken).toBeDefined();
    expect(refreshResult.expiresIn).toBe(900);
  });

  it('lança AppError com refresh token inválido', () => {
    expect(() => refreshAccessToken('token_invalido')).toThrow(AppError);
  });
});
