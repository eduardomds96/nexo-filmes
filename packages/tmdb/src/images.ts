export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/** Tamanhos usados no produto: `w342` em listas, `w500` no detalhe e `w185` no elenco. */
export type ImageSize = 'w185' | 'w342' | 'w500';

export function tmdbImageUrl(path: string | null, size: ImageSize): string | null {
  if (path === null || !path.startsWith('/')) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}
