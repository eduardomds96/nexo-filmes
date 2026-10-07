import type { FavoriteMovie, Rating } from '@nexo/contracts';

export interface GenreCount {
  readonly name: string;
  readonly count: number;
}

export interface DashboardStats {
  readonly totalFavorites: number;
  readonly totalRated: number;
  /** Média das notas dadas pelo usuário, ou `null` sem avaliações. */
  readonly averageScore: number | null;
  /** Gênero mais frequente entre os favoritos, ou `null` sem favoritos com gênero. */
  readonly topGenre: GenreCount | null;
  /** Favoritos por gênero, do mais ao menos frequente. */
  readonly genres: readonly GenreCount[];
}

const averageFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Nota média com uma casa decimal no formato pt-BR (ex.: `7,5`). */
export function formatAverage(value: number): string {
  return averageFormat.format(value);
}

export function averageScore(ratings: readonly Pick<Rating, 'score'>[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((total, rating) => total + rating.score, 0);
  return sum / ratings.length;
}

/** Quantos gêneros o gráfico do painel mostra; o resto vira "Outros". */
export const GENRE_CHART_LIMIT = 6;

/**
 * Quantos favoritos há em cada gênero, do mais frequente ao menos. Empate:
 * ordem alfabética (`localeCompare('pt-BR')`), então "Ação" vem antes de
 * "Drama". Um filme conta uma vez por gênero, mesmo se o gênero vier repetido.
 */
export function genreCounts(favorites: readonly Pick<FavoriteMovie, 'genres'>[]): GenreCount[] {
  const counts = new Map<string, number>();
  for (const movie of favorites) {
    for (const name of new Set(movie.genres.map((g) => g.name))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
}

export function mostFrequentGenre(
  favorites: readonly Pick<FavoriteMovie, 'genres'>[],
): GenreCount | null {
  return genreCounts(favorites)[0] ?? null;
}

/**
 * Dados do gráfico de gêneros: os mais frequentes e, se houver mais, a soma
 * dos demais em "Outros" (sempre por último).
 */
export function genreChartData(
  counts: readonly GenreCount[],
  limit = GENRE_CHART_LIMIT,
): GenreCount[] {
  if (counts.length <= limit) return [...counts];
  const top = counts.slice(0, limit - 1);
  const rest = counts.slice(limit - 1).reduce((total, item) => total + item.count, 0);
  return [...top, { name: 'Outros', count: rest }];
}

export function computeDashboard(
  favorites: readonly FavoriteMovie[],
  ratings: readonly Rating[],
): DashboardStats {
  return {
    totalFavorites: favorites.length,
    totalRated: ratings.length,
    averageScore: averageScore(ratings),
    topGenre: mostFrequentGenre(favorites),
    genres: genreCounts(favorites),
  };
}

export interface FavoriteWithRating extends FavoriteMovie {
  readonly userScore: number | null;
}

export function withUserScores(
  favorites: readonly FavoriteMovie[],
  ratings: ReadonlyMap<number, Rating>,
): FavoriteWithRating[] {
  return favorites.map((movie) => ({ ...movie, userScore: ratings.get(movie.id)?.score ?? null }));
}
