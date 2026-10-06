import { sharedTestOptions } from '@nexo/config/vitest';
import { defineProject } from 'vitest/config';

// Configuração própria de teste: não carrega o plugin de Module Federation.
export default defineProject({
  define: {
    __NEXO_REMOTES__: JSON.stringify({
      catalogo: 'http://localhost:3001/remoteEntry.js',
      filme: 'http://localhost:3002/remoteEntry.js',
      minha_area: 'http://localhost:3003/remoteEntry.js',
    }),
  },
  test: {
    ...sharedTestOptions,
    name: 'shell',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_TMDB_TOKEN: 'token-de-teste', VITE_TMDB_MOCK: 'false' },
  },
});
