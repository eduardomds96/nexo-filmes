/**
 * Mini-shell de desenvolvimento: permite rodar este micro-frontend sozinho
 * (`pnpm --filter @nexo/minha-area dev`). Reproduz o que o Shell oferece aos
 * remotes: roteador, QueryClient, Toaster, estilos de base e o lugar do
 * contador no cabeçalho. Não é exposto via Module Federation.
 */
import './dev.css';

import { Toaster } from '@nexo/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Link, Navigate, Outlet, RouterProvider } from 'react-router';

import DashboardPage from '../expose/DashboardPage';
import FavoritesCounter from '../expose/FavoritesCounter';
import FavoritesPage from '../expose/FavoritesPage';
import RatingsPage from '../expose/RatingsPage';

const queryClient = new QueryClient();

function DevLayout() {
  return (
    <div data-nexo-remote="minha_area" className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-dashed p-2 text-sm text-muted-foreground">
        <span>Minha área rodando isolada ·</span>
        <Link className="underline" to="/favoritos">
          /favoritos
        </Link>
        <Link className="underline" to="/avaliacoes">
          /avaliacoes
        </Link>
        <Link className="underline" to="/painel">
          /painel
        </Link>
        <span className="ml-auto">
          <FavoritesCounter />
        </span>
      </header>
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
      { path: '/', element: <Navigate to="/favoritos" replace /> },
      { path: '/favoritos', element: <FavoritesPage /> },
      { path: '/avaliacoes', element: <RatingsPage /> },
      { path: '/painel', element: <DashboardPage /> },
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
