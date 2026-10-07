import { federation } from '@module-federation/vite';
import { createShared, PORTS } from '@nexo/config/federation';
import { scopeRemoteUtilities } from '@nexo/config/postcss-scope-remote';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

const port = PORTS.minha_area;

export default defineConfig({
  envDir: '../..',
  plugins: [
    react(),
    tailwindcss(),
    // Serve o service worker usado no modo de dados simulados (VITE_TMDB_MOCK).
    msw({ mode: 'worker-only' }),
    federation({
      name: 'minha_area',
      filename: 'remoteEntry.js',
      exposes: {
        './FavoritesPage': './src/expose/FavoritesPage.tsx',
        './DashboardPage': './src/expose/DashboardPage.tsx',
        './RatingsPage': './src/expose/RatingsPage.tsx',
        './FavoritesCounter': './src/expose/FavoritesCounter.tsx',
      },
      shared: createShared(pkg),
      dts: false,
    }),
  ],
  server: { port, strictPort: true, origin: `http://localhost:${port}`, cors: true },
  preview: { port, strictPort: true, cors: true },
  css: {
    postcss: {
      // Utilitários deste remote valem só dentro do contêiner dele (ADR 0004).
      plugins: [scopeRemoteUtilities({ remote: 'minha_area', include: /\/styles\/remote\.css$/ })],
    },
  },
  build: { target: 'es2023' },
});
