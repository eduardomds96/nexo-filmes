import { defineConfig } from 'vitest/config';

/**
 * Agrega os testes de todos os pacotes e apps. A cobertura mínima vale só
 * para as pastas de regras de negócio: o adapter da TMDB, o repositório e a
 * store de dados do usuário, e as pastas `domain/` de cada app.
 */
export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts', 'apps/*/vitest.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'packages/tmdb/src/**/*.ts',
        'packages/user-data/src/**/*.ts',
        'apps/*/src/domain/**/*.{ts,tsx}',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/testing/**', '**/index.ts', '**/*.d.ts'],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
