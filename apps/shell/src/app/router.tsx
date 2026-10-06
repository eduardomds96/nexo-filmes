import { createBrowserRouter, Navigate } from 'react-router';
import type { RouteObject } from 'react-router';

import { RootLayout } from '../layout/RootLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { RemoteRoute } from '../remotes/RemoteRoute';

/** Rotas de topo. O Shell é dono delas; cada remote só fornece o componente da página. */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/filmes" replace /> },
      {
        path: 'filmes',
        element: <RemoteRoute id="catalogo/CatalogPage" areaLabel="o catálogo" />,
      },
      {
        path: 'filme/:id',
        element: <RemoteRoute id="filme/MoviePage" areaLabel="o detalhe do filme" />,
      },
      {
        path: 'favoritos',
        element: <RemoteRoute id="minha_area/FavoritesPage" areaLabel="seus favoritos" />,
      },
      {
        path: 'painel',
        element: <RemoteRoute id="minha_area/DashboardPage" areaLabel="o painel" />,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
