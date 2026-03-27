import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
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
    // Timeout mais alto para testes que envolvem crypto
    testTimeout: 10_000,
  },
  resolve: {
    // Suporte a imports com .js extension (Node.js ESM)
    extensions: ['.ts', '.js'],
  },
});
