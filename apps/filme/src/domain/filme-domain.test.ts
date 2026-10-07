import { ratingMessages } from '@nexo/user-data';
import { describe, expect, it } from 'vitest';

import { parseMovieId } from './movie-id';
import {
  detailsToSnapshot,
  parseScore,
  ratingFormSchema,
  ratingToFormValues,
  scoreFormatMessage,
} from './rating-form';

function errorsFor(input: { score: string; comment: string }) {
  const result = ratingFormSchema.safeParse(input);
  if (result.success) return {};
  // Como no formulário: a primeira mensagem de cada campo.
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
}

describe('parseMovieId', () => {
  it.each([
    ['550', 550],
    ['1', 1],
  ])('aceita %s', (param, expected) => {
    expect(parseMovieId(param)).toBe(expected);
  });

  it.each([undefined, '', '0', '-1', '12abc', '1.5', '007', '99999999999'])(
    'rejeita %j',
    (param) => {
      expect(parseMovieId(param)).toBeNull();
    },
  );
});

describe('parseScore', () => {
  it('aceita vírgula ou ponto', () => {
    expect(parseScore('7,5')).toBe(7.5);
    expect(parseScore(' 8.0 ')).toBe(8);
    expect(parseScore('10')).toBe(10);
  });

  it('texto que não é número vira NaN', () => {
    expect(parseScore('sete')).toBeNaN();
    expect(parseScore('7,5,1')).toBeNaN();
    expect(parseScore('-1')).toBeNaN();
  });
});

describe('ratingFormSchema', () => {
  it('converte a nota digitada em número', () => {
    expect(ratingFormSchema.parse({ score: '7,5', comment: 'Ótimo' })).toEqual({
      score: 7.5,
      comment: 'Ótimo',
    });
  });

  it.each(['0,5', '10'])('aceita o limite %s', (score) => {
    expect(ratingFormSchema.safeParse({ score, comment: '' }).success).toBe(true);
  });

  it.each(['0', '0,4', '10,5', '11'])('rejeita %s fora do intervalo', (score) => {
    expect(errorsFor({ score, comment: '' })).toEqual({ score: ratingMessages.scoreRange });
  });

  it.each(['7,3', '9,9', '0,75'])('rejeita %s fora do passo de 0,5', (score) => {
    expect(errorsFor({ score, comment: '' })).toEqual({ score: ratingMessages.scoreStep });
  });

  it('nota é obrigatória e precisa ser número', () => {
    expect(errorsFor({ score: '  ', comment: '' })).toEqual({
      score: ratingMessages.scoreRequired,
    });
    expect(errorsFor({ score: 'abc', comment: '' })).toEqual({ score: scoreFormatMessage });
  });

  it('comentário aceita 500 caracteres e rejeita 501', () => {
    expect(ratingFormSchema.safeParse({ score: '5', comment: 'a'.repeat(500) }).success).toBe(true);
    expect(errorsFor({ score: '5', comment: 'a'.repeat(501) })).toEqual({
      comment: ratingMessages.commentTooLong,
    });
  });

  it('mostra um erro por campo ao mesmo tempo', () => {
    expect(errorsFor({ score: '', comment: 'a'.repeat(501) })).toEqual({
      score: ratingMessages.scoreRequired,
      comment: ratingMessages.commentTooLong,
    });
  });
});

describe('conversões', () => {
  it('avaliação salva vira valores do formulário em pt-BR', () => {
    expect(ratingToFormValues(null)).toEqual({ score: '', comment: '' });
    expect(
      ratingToFormValues({
        movieId: 1,
        score: 7.5,
        comment: 'x',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        movie: null,
      }),
    ).toEqual({ score: '7,5', comment: 'x' });
  });

  it('snapshot do favorito usa o pôster de lista', () => {
    expect(
      detailsToSnapshot({
        id: 1,
        title: 'T',
        year: 2000,
        posterUrl: 'https://img/w500/p.jpg',
        posterThumbUrl: 'https://img/w342/p.jpg',
        voteAverage: 7,
        voteCount: 1,
        runtimeMinutes: 100,
        overview: '',
        tagline: null,
        genres: [{ id: 18, name: 'Drama' }],
        directors: [],
        cast: [],
      }),
    ).toEqual({
      id: 1,
      title: 'T',
      year: 2000,
      posterUrl: 'https://img/w342/p.jpg',
      genres: [{ id: 18, name: 'Drama' }],
    });
  });
});
