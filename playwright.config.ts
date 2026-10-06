import { defineConfig, devices } from '@playwright/test';

/**
 * Testes ponta a ponta contra o build de produção (Shell + 3 remotes em
 * preview), com a TMDB simulada (MSW): nenhum teste chama a API real.
 */
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
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:3003/remoteEntry.js',
    reuseExistingServer: !process.env['CI'],
    timeout: 240_000,
    env: {
      VITE_TMDB_MOCK: 'true',
      VITE_USER_DATA_MIN_DELAY_MS: '300',
      VITE_USER_DATA_MAX_DELAY_MS: '600',
      VITE_USER_DATA_FAIL_SUFFIX: '13',
    },
  },
});
