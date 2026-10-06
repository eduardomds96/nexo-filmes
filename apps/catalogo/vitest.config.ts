import { sharedTestOptions } from '@nexo/config/vitest';
import { defineProject } from 'vitest/config';

// Configuração própria de teste: não carrega o plugin de Module Federation.
export default defineProject({
  test: {
    ...sharedTestOptions,
    name: 'catalogo',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_TMDB_TOKEN: 'token-de-teste', VITE_TMDB_MOCK: 'false' },
  },
});
