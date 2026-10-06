import { federation } from '@module-federation/vite';
import { createShared, PORTS } from '@nexo/config/federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

const port = PORTS.catalogo;

export default defineConfig({
  envDir: '../..',
  plugins: [
    react(),
    federation({
      name: 'catalogo',
      filename: 'remoteEntry.js',
      exposes: {
        './CatalogPage': './src/expose/CatalogPage.tsx',
      },
      shared: createShared(pkg),
      dts: false,
    }),
  ],
  server: { port, strictPort: true, origin: `http://localhost:${port}`, cors: true },
  preview: { port, strictPort: true, cors: true },
  build: { target: 'es2023' },
});
