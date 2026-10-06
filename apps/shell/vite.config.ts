import { federation } from '@module-federation/vite';
import { createShared, PORTS, remoteEntries } from '@nexo/config/federation';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import { defineConfig, loadEnv } from 'vite';

import pkg from './package.json' with { type: 'json' };

const port = PORTS.shell;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../..', 'VITE_');
  const entries = remoteEntries(env);
  return {
    envDir: '../..',
    define: { __NEXO_REMOTES__: JSON.stringify(entries) },
    plugins: [
      react(),
      tailwindcss(),
      // Serve o service worker usado no modo de dados simulados (VITE_TMDB_MOCK).
      msw({ mode: 'worker-only' }),
      federation({
        name: 'shell',
        // Remotes são registrados em runtime (src/remotes/remote-loader.ts) para
        // permitir um novo carregamento real no "Tentar novamente".
        remotes: {},
        shared: createShared(pkg),
        dts: false,
      }),
    ],
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
    build: { target: 'es2023' },
  };
});
