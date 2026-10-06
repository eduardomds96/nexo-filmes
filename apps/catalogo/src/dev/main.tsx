/**
 * Mini-shell de desenvolvimento: permite rodar este micro-frontend sozinho
 * (`pnpm --filter @nexo/catalogo dev`). Reproduz o que o Shell oferece aos
 * remotes: roteador, QueryClient, Toaster e estilos de base. Não é exposto
 * via Module Federation.
 */
import './dev.css';

import { shouldRetryTmdbRequest } from '@nexo/tmdb';
import { Toaster } from '@nexo/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Link, Navigate, Outlet, RouterProvider } from 'react-router';

import CatalogPage from '../expose/CatalogPage';

// Modo de dados simulados: a TMDB é respondida por um service worker (MSW).
if (import.meta.env.VITE_TMDB_MOCK === 'true') {
  const { startTmdbMock } = await import('@nexo/tmdb/mock-browser');
  await startTmdbMock();
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetryTmdbRequest, refetchOnWindowFocus: false } },
});

function DevLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <p className="mb-4 rounded-md border border-dashed p-2 text-sm text-muted-foreground">
        Catálogo rodando isolado ·{' '}
        <Link className="underline" to="/filmes">
          /filmes
        </Link>
      </p>
      <main id="conteudo">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <DevLayout />,
    children: [
      { path: '/', element: <Navigate to="/filmes" replace /> },
      {
        path: '/filmes',
        element: (
          <div data-nexo-remote="catalogo" className="contents">
            <CatalogPage />
          </div>
        ),
      },
      { path: '*', element: <p>Rota fora deste micro-frontend.</p> },
    ],
  },
]);

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
