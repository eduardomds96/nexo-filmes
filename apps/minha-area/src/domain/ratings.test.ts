import type { Rating } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';

import {
  parseRatingsOrder,
  ratingsHref,
  sortRatings,
  summarizeRatings,
  wasEdited,
} from './ratings';

function rating(movieId: number, score: number, title: string | null, updatedAt: string): Rating {
  return {
    movieId,
    score,
    comment: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
    movie: title === null ? null : { id: movieId, title, year: 2000, posterUrl: null, genres: [] },
  };
}

const ratings = [
  rating(1, 7, 'Zodíaco', '2026-03-01T00:00:00.000Z'),
  rating(2, 9.5, 'Amélie', '2026-01-10T00:00:00.000Z'),
  rating(3, 7, 'Ação Final', '2026-05-01T00:00:00.000Z'),
  rating(4, 4, null, '2026-02-01T00:00:00.000Z'),
];

const ids = (list: Rating[]) => list.map((r) => r.movieId);

describe('ordenação das avaliações', () => {
  it('mais recentes primeiro (padrão)', () => {
    expect(ids(sortRatings(ratings, 'recentes'))).toEqual([3, 1, 4, 2]);
  });

  it('maior nota, com empate pela mais recente', () => {
    expect(ids(sortRatings(ratings, 'maior-nota'))).toEqual([2, 3, 1, 4]);
  });

  it('menor nota, com empate pela mais recente', () => {
    expect(ids(sortRatings(ratings, 'menor-nota'))).toEqual([4, 3, 1, 2]);
  });

  it('título em ordem alfabética pt-BR, sem título no fim', () => {
    expect(ids(sortRatings(ratings, 'titulo'))).toEqual([3, 2, 1, 4]);
  });

  it('não altera a lista original', () => {
    const copy = [...ratings];
    sortRatings(ratings, 'maior-nota');
    expect(ratings).toEqual(copy);
  });
});

describe('ordem na URL', () => {
  it('lê valores conhecidos e usa "recentes" no resto', () => {
    expect(parseRatingsOrder('maior-nota')).toBe('maior-nota');
    expect(parseRatingsOrder('titulo')).toBe('titulo');
    expect(parseRatingsOrder(null)).toBe('recentes');
    expect(parseRatingsOrder('qualquer')).toBe('recentes');
  });

  it('monta o href omitindo a ordem padrão', () => {
    expect(ratingsHref('recentes')).toBe('/avaliacoes');
    expect(ratingsHref('menor-nota')).toBe('/avaliacoes?ordem=menor-nota');
  });
});

describe('resumo', () => {
  it('conta e calcula a média', () => {
    expect(summarizeRatings(ratings)).toEqual({ count: 4, average: 6.875 });
    expect(summarizeRatings([])).toEqual({ count: 0, average: null });
  });

  it('identifica avaliação editada', () => {
    expect(wasEdited({ createdAt: 'a', updatedAt: 'a' })).toBe(false);
    expect(wasEdited({ createdAt: 'a', updatedAt: 'b' })).toBe(true);
  });
});
