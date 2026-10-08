import { federation } from '@module-federation/vite';
import { createShared, PORTS, remoteEntries } from '@nexo/config/federation';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';

import pkg from './package.json' with { type: 'json' };

const port = PORTS.shell;

/**
 * Gera `remotes.json` (URLs dos remotes) no build e o serve em dev. O Shell
 * lê esse arquivo no boot, então as URLs podem mudar sem rebuild.
 */
function remotesManifest(entries: Record<string, string>): Plugin {
  const json = `${JSON.stringify(entries, null, 2)}
`;
  return {
    name: 'nexo-remotes-manifest',
    configureServer(server) {
      server.middlewares.use('/remotes.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(json);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'remotes.json', source: json });
    },
    // No build, o navegador começa a baixar o manifesto e o remoteEntry de cada
    // remote junto com o HTML, sem esperar a cadeia de dependências do Shell.
    // Se o remotes.json publicado apontar para outras URLs, o preload só sobra.
    transformIndexHtml(_html, context) {
      if (context.server) return [];
      return [
        {
          tag: 'link',
          attrs: { rel: 'preload', href: '/remotes.json', as: 'fetch', crossorigin: 'anonymous' },
          injectTo: 'head-prepend',
        },
        ...Object.values(entries).map((href) => ({
          tag: 'link',
          attrs: { rel: 'modulepreload', href, crossorigin: 'anonymous' },
          injectTo: 'head-prepend' as const,
        })),
      ];
    },
  };
}

/**
 * Preload das fontes no HTML: sem ele, o navegador só as descobre depois de
 * baixar e ler o CSS. Só os arquivos latinos, que cobrem o português.
 */
function preloadFonts(patterns: readonly RegExp[]): Plugin {
  return {
    name: 'nexo-preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const files = Object.keys(context.bundle ?? {});
        return files
          .filter((file) => patterns.some((pattern) => pattern.test(file)))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${file}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: 'anonymous',
            },
            injectTo: 'head' as const,
          }));
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../..', 'VITE_');
  const entries = remoteEntries(env);
  return {
    envDir: '../..',
    define: { __NEXO_REMOTES__: JSON.stringify(entries) },
    plugins: [
      react(),
      tailwindcss(),
      remotesManifest(entries),
      preloadFonts([
        /geist-latin-wght-normal-.*\.woff2$/,
        /bricolage-grotesque-latin-opsz-normal-.*\.woff2$/,
      ]),
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
