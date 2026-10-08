import type { RemoteModuleId } from '@nexo/contracts';
import { matchPath } from 'react-router';

import { getRemoteModule } from './remote-loader';

export interface PageRemote {
  readonly path: string;
  readonly id: RemoteModuleId;
  /** Nome da área na mensagem de erro (ex.: "o catálogo"). */
  readonly areaLabel: string;
}

/** Páginas servidas por remotes. O roteador e o carregamento antecipado usam a mesma tabela. */
export const PAGE_REMOTES: readonly PageRemote[] = [
  { path: 'filmes', id: 'catalogo/CatalogPage', areaLabel: 'o catálogo' },
  { path: 'filme/:id', id: 'filme/MoviePage', areaLabel: 'o detalhe do filme' },
  { path: 'favoritos', id: 'minha_area/FavoritesPage', areaLabel: 'seus favoritos' },
  { path: 'avaliacoes', id: 'minha_area/RatingsPage', areaLabel: 'suas avaliações' },
  { path: 'painel', id: 'minha_area/DashboardPage', areaLabel: 'o painel' },
];

export const HEADER_REMOTE: RemoteModuleId = 'minha_area/FavoritesCounter';

export function remoteForPath(pathname: string): RemoteModuleId | null {
  // `/` redireciona para o catálogo.
  if (pathname === '/' || pathname === '') return 'catalogo/CatalogPage';
  return PAGE_REMOTES.find((page) => matchPath(`/${page.path}`, pathname))?.id ?? null;
}

/**
 * Começa a carregar, antes do primeiro render, o remote da página atual e o
 * do cabeçalho. O `RemoteBoundary` reaproveita as mesmas promises.
 */
export function preloadRemotesFor(pathname: string): void {
  const ids = [HEADER_REMOTE, remoteForPath(pathname)];
  for (const id of ids) {
    if (id) void getRemoteModule(id).catch(() => undefined);
  }
}
