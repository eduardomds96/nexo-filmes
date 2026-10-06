import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './server';

// Consultas assíncronas (findBy*, waitFor) com folga para a execução com cobertura.
configure({ asyncUtilTimeout: 5000 });

// jsdom não implementa rolagem.
Element.prototype.scrollIntoView = vi.fn();
// jsdom não implementa matchMedia (usado pelo tema).
window.matchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(() => false),
}));

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
