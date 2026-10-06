import { describe, expect, it } from 'vitest';

import {
  RATING_COMMENT_MAX_LENGTH,
  RATING_SCORES,
  ratingInputSchema,
  ratingMessages,
} from './rules';

function messagesFor(input: unknown) {
  const result = ratingInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('ratingInputSchema', () => {
  it.each([0.5, 1, 7.5, 10])('aceita a nota %d', (score) => {
    expect(ratingInputSchema.safeParse({ movieId: 1, score }).success).toBe(true);
  });

  it.each([0, 0.4, 10.5, 11, -1])('rejeita a nota %d fora do intervalo', (score) => {
    expect(messagesFor({ movieId: 1, score })).toContain(ratingMessages.scoreRange);
  });

  it.each([0.7, 3.25, 9.9])('rejeita a nota %d fora do passo de 0,5', (score) => {
    expect(messagesFor({ movieId: 1, score })).toEqual([ratingMessages.scoreStep]);
  });

  it('exige a nota', () => {
    expect(messagesFor({ movieId: 1 })).toEqual([ratingMessages.scoreRequired]);
    expect(messagesFor({ movieId: 1, score: Number.NaN })).toEqual([ratingMessages.scoreRequired]);
  });

  it('aceita comentário ausente, vazio ou com exatamente 500 caracteres', () => {
    expect(ratingInputSchema.safeParse({ movieId: 1, score: 5 }).success).toBe(true);
    expect(ratingInputSchema.safeParse({ movieId: 1, score: 5, comment: '' }).success).toBe(true);
    const comment = 'a'.repeat(RATING_COMMENT_MAX_LENGTH);
    expect(ratingInputSchema.safeParse({ movieId: 1, score: 5, comment }).success).toBe(true);
  });

  it('rejeita comentário com 501 caracteres', () => {
    const comment = 'a'.repeat(RATING_COMMENT_MAX_LENGTH + 1);
    expect(messagesFor({ movieId: 1, score: 5, comment })).toEqual([ratingMessages.commentTooLong]);
  });
});

describe('RATING_SCORES', () => {
  it('lista as 20 notas de 0,5 a 10', () => {
    expect(RATING_SCORES).toHaveLength(20);
    expect(RATING_SCORES[0]).toBe(0.5);
    expect(RATING_SCORES.at(-1)).toBe(10);
  });
});
