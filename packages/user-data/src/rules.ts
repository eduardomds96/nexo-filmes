import { z } from 'zod';

/** Regras de negócio da avaliação. São usadas pelo repositório e pelos formulários. */
export const RATING_SCORE_MIN = 0.5;
export const RATING_SCORE_MAX = 10;
export const RATING_SCORE_STEP = 0.5;
export const RATING_COMMENT_MAX_LENGTH = 500;

/** Notas válidas, de 0,5 a 10 em passos de 0,5. */
export const RATING_SCORES: readonly number[] = Array.from(
  { length: (RATING_SCORE_MAX - RATING_SCORE_MIN) / RATING_SCORE_STEP + 1 },
  (_, index) => RATING_SCORE_MIN + index * RATING_SCORE_STEP,
);

export function isValidScoreStep(score: number): boolean {
  return Number.isInteger(score / RATING_SCORE_STEP);
}

export const ratingMessages = {
  scoreRequired: 'Escolha uma nota.',
  scoreRange: 'A nota deve estar entre 0,5 e 10.',
  scoreStep: 'A nota deve variar de 0,5 em 0,5.',
  commentTooLong: `O comentário pode ter no máximo ${String(RATING_COMMENT_MAX_LENGTH)} caracteres.`,
} as const;

export const ratingScoreSchema = z
  .number({ error: ratingMessages.scoreRequired })
  .min(RATING_SCORE_MIN, { error: ratingMessages.scoreRange })
  .max(RATING_SCORE_MAX, { error: ratingMessages.scoreRange })
  .refine(isValidScoreStep, { error: ratingMessages.scoreStep });

export const ratingCommentSchema = z
  .string()
  .max(RATING_COMMENT_MAX_LENGTH, { error: ratingMessages.commentTooLong });

export const ratingInputSchema = z.object({
  movieId: z.number().int().positive(),
  score: ratingScoreSchema,
  comment: ratingCommentSchema.optional(),
});
