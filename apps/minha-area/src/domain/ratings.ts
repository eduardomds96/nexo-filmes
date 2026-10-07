import type { Rating } from '@nexo/contracts';

import { averageScore } from './dashboard';

/** Ordenações da lista de avaliações, guardadas na URL (`/avaliacoes?ordem=`). */
export const RATINGS_ORDERS = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'maior-nota', label: 'Maior nota' },
  { value: 'menor-nota', label: 'Menor nota' },
  { value: 'titulo', label: 'Título (A–Z)' },
] as const;

export type RatingsOrder = (typeof RATINGS_ORDERS)[number]['value'];

export const DEFAULT_RATINGS_ORDER: RatingsOrder = 'recentes';

export function parseRatingsOrder(value: string | null): RatingsOrder {
  return RATINGS_ORDERS.find((order) => order.value === value)?.value ?? DEFAULT_RATINGS_ORDER;
}

export function ratingsHref(order: RatingsOrder): string {
  return order === DEFAULT_RATINGS_ORDER ? '/avaliacoes' : `/avaliacoes?ordem=${order}`;
}

const byRecent = (a: Rating, b: Rating) => b.updatedAt.localeCompare(a.updatedAt);

/** Título para ordenar; avaliações sem snapshot do filme vão para o fim. */
function titleOf(rating: Rating): string | null {
  return rating.movie?.title ?? null;
}

/** Ordena sem alterar a lista original. Empates caem na mais recente primeiro. */
export function sortRatings(ratings: readonly Rating[], order: RatingsOrder): Rating[] {
  const list = [...ratings];
  switch (order) {
    case 'maior-nota':
      return list.sort((a, b) => b.score - a.score || byRecent(a, b));
    case 'menor-nota':
      return list.sort((a, b) => a.score - b.score || byRecent(a, b));
    case 'titulo':
      return list.sort((a, b) => {
        const ta = titleOf(a);
        const tb = titleOf(b);
        if (ta === null || tb === null) return ta === tb ? byRecent(a, b) : ta === null ? 1 : -1;
        return ta.localeCompare(tb, 'pt-BR') || byRecent(a, b);
      });
    case 'recentes':
      return list.sort(byRecent);
  }
}

/** A avaliação foi alterada depois de criada. */
export function wasEdited(rating: Pick<Rating, 'createdAt' | 'updatedAt'>): boolean {
  return rating.updatedAt !== rating.createdAt;
}

export interface RatingsSummary {
  readonly count: number;
  readonly average: number | null;
}

export function summarizeRatings(ratings: readonly Rating[]): RatingsSummary {
  return { count: ratings.length, average: averageScore(ratings) };
}
