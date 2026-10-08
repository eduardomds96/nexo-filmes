import type { MovieDetails } from '@nexo/contracts';
import { toMetaDescription } from '@nexo/ui';

export function movieDescription(movie: Pick<MovieDetails, 'title' | 'year' | 'overview'>): string {
  if (movie.overview) return toMetaDescription(movie.overview);
  const year = movie.year === null ? '' : ` (${String(movie.year)})`;
  return `${movie.title}${year}: sinopse, elenco, direção e nota da TMDB no Nexo Filmes.`;
}
