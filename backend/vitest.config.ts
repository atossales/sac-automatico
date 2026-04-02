import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // Setup file executado antes de cada test file — define env vars antes dos imports
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/__tests__/',
        'prisma/',
      ],
    },
    testTimeout: 15_000,
    // Força CJS/ESM interop para pacotes com problemas de compatibilidade no Node 24
    deps: {
      optimizer: {
        ssr: {
          include: ['jsonwebtoken', 'bcryptjs', 'semver'],
        },
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
