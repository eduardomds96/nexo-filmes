import { defineConfig, devices } from '@playwright/test';

/**
 * Testes ponta a ponta contra o build de produção (Shell + 3 remotes em
 * preview), com a TMDB simulada (MSW): nenhum teste chama a API real.
 */
const e2eEnv = {
  VITE_TMDB_MOCK: 'true',
  VITE_USER_DATA_MIN_DELAY_MS: '300',
  VITE_USER_DATA_MAX_DELAY_MS: '600',
  VITE_USER_DATA_FAIL_SUFFIX: '13',
};

/**
 * Um processo `vite preview` por app, sem Turborepo no meio: assim o
 * Playwright consegue encerrá-los ao final (via turbo, no Windows, os previews
 * ficavam órfãos ocupando as portas). Os servidores sobem em sequência, então
 * o build feito pelo primeiro termina antes dos demais. Nunca reaproveita um
 * servidor já aberto: um `pnpm dev` com a TMDB real não pode ser testado por engano.
 */
function previewServer(app: string, port: number, { buildFirst = false } = {}) {
  const preview = 'node node_modules/vite/bin/vite.js preview';
  return {
    command: buildFirst ? `pnpm --dir ../.. build && ${preview}` : preview,
    cwd: `apps/${app}`,
    url: `http://localhost:${String(port)}/`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: e2eEnv,
  };
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    previewServer('shell', 3000, { buildFirst: true }),
    previewServer('catalogo', 3001),
    previewServer('filme', 3002),
    previewServer('minha-area', 3003),
  ],
});
