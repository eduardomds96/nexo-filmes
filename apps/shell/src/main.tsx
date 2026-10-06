import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { registerKnownRemotes } from './remotes/remote-loader';
import { applyTheme, currentTheme } from './theme/theme';

// Modo de dados simulados: a TMDB é respondida por um service worker (MSW).
if (import.meta.env.VITE_TMDB_MOCK === 'true') {
  const { startTmdbMock } = await import('@nexo/tmdb/mock-browser');
  await startTmdbMock();
}

applyTheme(currentTheme());
registerKnownRemotes();

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
