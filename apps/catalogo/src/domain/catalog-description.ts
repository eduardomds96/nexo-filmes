import { APP_DESCRIPTION } from '@nexo/ui';

import type { CatalogState } from './catalog-params';

export function catalogDescription(state: CatalogState, genreName: string | null): string {
  if (state.query) {
    const genre = genreName ? ` em ${genreName}` : '';
    return `Resultados da busca por “${state.query}”${genre} no Nexo Filmes: pôsteres, notas da TMDB e gêneros.`;
  }
  if (genreName) {
    return `Filmes de ${genreName} mais populares no Nexo Filmes: veja notas da TMDB, guarde favoritos e avalie.`;
  }
  return APP_DESCRIPTION;
}
