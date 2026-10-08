export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Tamanhos usados no produto: `w342` em listas, `w500` no detalhe, `w185` no
 * elenco e `w1280` na imagem de fundo do detalhe.
 */
export type ImageSize = 'w185' | 'w342' | 'w500' | 'w1280';

export function tmdbImageUrl(path: string | null, size: ImageSize): string | null {
  if (path === null || !path.startsWith('/')) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

/** Larguras oferecidas no `srcset` dos pôsteres: o navegador baixa a menor que serve. */
export const POSTER_SRCSET_WIDTHS = [185, 342, 500] as const;

const TMDB_IMAGE_PATTERN = /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+(\/.+)$/;

/** `srcset` de um pôster da TMDB, ou `undefined` para URLs que não são da TMDB. */
export function tmdbPosterSrcSet(url: string | null): string | undefined {
  const path = url === null ? undefined : TMDB_IMAGE_PATTERN.exec(url)?.[1];
  if (path === undefined) return undefined;
  return POSTER_SRCSET_WIDTHS.map(
    (width) => `${TMDB_IMAGE_BASE_URL}/w${String(width)}${path} ${String(width)}w`,
  ).join(', ');
}
