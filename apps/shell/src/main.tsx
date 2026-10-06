import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { BUILD_REMOTE_ENTRIES, registerKnownRemotes } from './remotes/remote-loader';
import { resolveRemoteEntries } from './remotes/remote-manifest';
import { applyTheme, currentTheme } from './theme/theme';

// Modo de dados simulados: a TMDB é respondida por um service worker (MSW).
if (import.meta.env.VITE_TMDB_MOCK === 'true') {
  const { startTmdbMock } = await import('@nexo/tmdb/mock-browser');
  await startTmdbMock();
}

applyTheme(currentTheme());
const { entries } = await resolveRemoteEntries(BUILD_REMOTE_ENTRIES);
registerKnownRemotes(entries);

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
