import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './server';

// Consultas assíncronas (findBy*, waitFor) com folga para a execução com cobertura.
configure({ asyncUtilTimeout: 5000 });

// jsdom não implementa rolagem.
Element.prototype.scrollIntoView = vi.fn();

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  delete document.documentElement.dataset['nexoBooted'];
});

afterAll(() => {
  server.close();
});
