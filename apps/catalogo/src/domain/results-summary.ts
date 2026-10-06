import { plural } from '@nexo/ui';

import type { CatalogResult } from './catalog-request';

/** Texto anunciado (aria-live) quando os resultados mudam. */
export function resultsSummary(result: CatalogResult, genreName: string | null): string {
  if (result.genreFilteredLocally) {
    const shown = plural(result.items.length, 'filme', 'filmes');
    const genre = genreName ?? 'do gênero escolhido';
    return `${shown} de ${genre} nesta página da busca (${plural(result.totalResults, 'resultado', 'resultados')} no total).`;
  }
  const found = result.totalResults === 1 ? 'encontrado' : 'encontrados';
  return `${plural(result.totalResults, 'filme', 'filmes')} ${found}.`;
}
