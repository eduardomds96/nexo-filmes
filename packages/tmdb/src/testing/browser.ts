import { setupWorker } from 'msw/browser';

import { createDemoHandlers } from './demo-handlers';

/**
 * Liga a TMDB simulada no navegador (modo `VITE_TMDB_MOCK=true`). O service
 * worker intercepta as chamadas feitas por qualquer micro-frontend da página.
 */
export async function startTmdbMock(): Promise<void> {
  const worker = setupWorker(...createDemoHandlers());
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true });
}
