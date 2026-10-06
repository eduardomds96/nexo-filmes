import { setupWorker } from 'msw/browser';

import { createDemoHandlers } from './demo-handlers';

/**
 * Liga a TMDB simulada no navegador (modo `VITE_TMDB_MOCK=true`). O service
 * worker intercepta as chamadas feitas por qualquer micro-frontend da página.
 * Se o navegador não permitir service workers, o portal abre mesmo assim (as
 * chamadas à TMDB vão falhar e cada área mostra seu estado de erro).
 */
export async function startTmdbMock(): Promise<void> {
  try {
    const worker = setupWorker(...createDemoHandlers());
    await worker.start({ onUnhandledFrame: 'bypass', quiet: true });
  } catch (error) {
    console.warn('[nexo] Não foi possível iniciar a TMDB simulada.', error);
  }
}
