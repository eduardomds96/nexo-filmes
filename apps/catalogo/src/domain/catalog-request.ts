import type { Movie, MovieSnapshot, Page } from '@nexo/contracts';
import type { TmdbClient } from '@nexo/tmdb';

import { isSearchActive } from './catalog-params';
import type { CatalogState } from './catalog-params';

/**
 * Como o catálogo consulta a TMDB.
 *
 * - Sem busca: `/discover/movie`, que aceita filtro de gênero no servidor.
 * - Com busca: `/search/movie`, que **não** aceita gênero. Nesse caso o
 *   filtro de gênero é aplicado sobre os resultados da página atual, via os
 *   gêneros de cada filme, e a paginação continua sendo a da busca
 *   (ver docs/adr/0003).
 */
export type CatalogRequest =
  | { readonly kind: 'discover'; readonly page: number; readonly genreId: number | null }
  | {
      readonly kind: 'search';
      readonly query: string;
      readonly page: number;
      readonly genreId: number | null;
    };

export function toCatalogRequest(state: CatalogState): CatalogRequest {
  if (isSearchActive(state)) {
    return { kind: 'search', query: state.query, page: state.page, genreId: state.genreId };
  }
  return { kind: 'discover', page: state.page, genreId: state.genreId };
}

export interface CatalogResult extends Page<Movie> {
  /** Filmes da página da busca descartados pelo filtro de gênero local. */
  readonly hiddenByGenre: number;
  /** Indica que o gênero foi filtrado localmente sobre uma busca. */
  readonly genreFilteredLocally: boolean;
}

export function filterPageByGenre(page: Page<Movie>, genreId: number | null): CatalogResult {
  if (genreId === null) return { ...page, hiddenByGenre: 0, genreFilteredLocally: false };
  const items = page.items.filter((movie) => movie.genres.some((g) => g.id === genreId));
  return {
    ...page,
    items,
    hiddenByGenre: page.items.length - items.length,
    genreFilteredLocally: true,
  };
}

export async function fetchCatalog(
  client: TmdbClient,
  request: CatalogRequest,
  signal?: AbortSignal,
): Promise<CatalogResult> {
  if (request.kind === 'discover') {
    const page = await client.discoverMovies(
      { page: request.page, genreId: request.genreId },
      signal,
    );
    return { ...page, hiddenByGenre: 0, genreFilteredLocally: false };
  }
  const page = await client.searchMovies({ query: request.query, page: request.page }, signal);
  return filterPageByGenre(page, request.genreId);
}

export function catalogQueryKey(request: CatalogRequest) {
  return ['tmdb', 'catalog', request] as const;
}

export function toSnapshot(movie: Movie): MovieSnapshot {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    posterUrl: movie.posterUrl,
    genres: movie.genres,
  };
}
