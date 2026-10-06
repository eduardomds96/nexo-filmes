/**
 * Mini-shell de desenvolvimento: permite rodar este micro-frontend sozinho.
 * Não é exposto via Module Federation e nunca chega ao Shell.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';

import DashboardPage from '../expose/DashboardPage';
import FavoritesCounter from '../expose/FavoritesCounter';
import FavoritesPage from '../expose/FavoritesPage';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/favoritos" replace /> },
  {
    path: '/favoritos',
    element: (
      <>
        <FavoritesCounter />
        <FavoritesPage />
      </>
    ),
  },
  { path: '/painel', element: <DashboardPage /> },
]);

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
