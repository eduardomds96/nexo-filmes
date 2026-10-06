import { federation } from '@module-federation/vite';
import { createShared, PORTS } from '@nexo/config/federation';
import { scopeRemoteUtilities } from '@nexo/config/postcss-scope-remote';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

const port = PORTS.filme;

export default defineConfig({
  envDir: '../..',
  plugins: [
    react(),
    tailwindcss(),
    // Serve o service worker usado no modo de dados simulados (VITE_TMDB_MOCK).
    msw({ mode: 'worker-only' }),
    federation({
      name: 'filme',
      filename: 'remoteEntry.js',
      exposes: {
        './MoviePage': './src/expose/MoviePage.tsx',
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
      plugins: [scopeRemoteUtilities({ remote: 'filme', include: /\/styles\/remote\.css$/ })],
    },
  },
  build: { target: 'es2023' },
});
