import { createBrowserRouter, Navigate } from 'react-router';

import { RootLayout } from '../layout/RootLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RemoteBoundary } from '../remotes/RemoteBoundary';
import { RemoteErrorPanel } from '../remotes/RemoteErrorPanel';

const loading = <p>Carregando…</p>;

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/filmes" replace /> },
      {
        path: 'filmes',
        element: (
          <RemoteBoundary
            id="catalogo/CatalogPage"
            renderError={RemoteErrorPanel}
            areaLabel="o catálogo"
            fallback={loading}
          />
        ),
      },
      {
        path: 'filme/:id',
        element: (
          <RemoteBoundary
            id="filme/MoviePage"
            renderError={RemoteErrorPanel}
            areaLabel="o detalhe do filme"
            fallback={loading}
          />
        ),
      },
      {
        path: 'favoritos',
        element: (
          <RemoteBoundary
            id="minha_area/FavoritesPage"
            renderError={RemoteErrorPanel}
            areaLabel="seus favoritos"
            fallback={loading}
          />
        ),
      },
      {
        path: 'painel',
        element: (
          <RemoteBoundary
            id="minha_area/DashboardPage"
            renderError={RemoteErrorPanel}
            areaLabel="o painel"
            fallback={loading}
          />
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
