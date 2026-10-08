import { createBrowserRouter, Navigate } from 'react-router';
import type { RouteObject } from 'react-router';

import { RootLayout } from '../layout/RootLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { PAGE_REMOTES } from '../remotes/page-remotes';
import { RemoteRoute } from '../remotes/RemoteRoute';

/** Rotas de topo. O Shell é dono delas; cada remote só fornece o componente da página. */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/filmes" replace /> },
      ...PAGE_REMOTES.map(({ path, id, areaLabel }) => ({
        path,
        element: <RemoteRoute id={id} areaLabel={areaLabel} />,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
