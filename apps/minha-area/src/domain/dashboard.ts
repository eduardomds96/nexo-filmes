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

/**
 * Gênero que mais aparece entre os favoritos. Empate: ordem alfabética
 * (`localeCompare('pt-BR')`), então "Ação" vem antes de "Drama".
 */
export function mostFrequentGenre(
  favorites: readonly Pick<FavoriteMovie, 'genres'>[],
): GenreCount | null {
  const counts = new Map<string, number>();
  for (const movie of favorites) {
    // Um filme conta uma vez por gênero, mesmo se o gênero vier repetido.
    for (const name of new Set(movie.genres.map((g) => g.name))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  let top: GenreCount | null = null;
  for (const [name, count] of counts) {
    if (
      top === null ||
      count > top.count ||
      (count === top.count && name.localeCompare(top.name, 'pt-BR') < 0)
    ) {
      top = { name, count };
    }
  }
  return top;
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
  };
}

export interface FavoriteWithRating extends FavoriteMovie {
  readonly userScore: number | null;
}

/** Junta cada favorito com a nota que o usuário deu (se houver). */
export function withUserScores(
  favorites: readonly FavoriteMovie[],
  ratings: ReadonlyMap<number, Rating>,
): FavoriteWithRating[] {
  return favorites.map((movie) => ({ ...movie, userScore: ratings.get(movie.id)?.score ?? null }));
}
