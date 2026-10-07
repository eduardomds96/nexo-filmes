import type { MovieDetails, MovieSnapshot, Rating } from '@nexo/contracts';
import { formatUserScore } from '@nexo/ui';
import { ratingCommentSchema, ratingMessages, ratingScoreSchema } from '@nexo/user-data';
import { z } from 'zod';

export const scoreFormatMessage = 'Digite um número, como 7,5.';

/** Aceita "7,5" ou "7.5". Texto que não é número vira `NaN`. */
export function parseScore(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

/**
 * Schema do formulário de avaliação. Usa as mesmas regras do repositório
 * (`ratingScoreSchema` e `ratingCommentSchema`), com a nota digitada como
 * texto para aceitar vírgula decimal.
 */
export const ratingFormSchema = z.object({
  score: z
    .string()
    .trim()
    .min(1, { error: ratingMessages.scoreRequired })
    .transform((value, ctx) => {
      const score = parseScore(value);
      if (Number.isNaN(score)) {
        ctx.addIssue({ code: 'custom', message: scoreFormatMessage });
        return z.NEVER;
      }
      return score;
    })
    .pipe(ratingScoreSchema),
  comment: ratingCommentSchema,
});

export type RatingFormInput = z.input<typeof ratingFormSchema>;
export type RatingFormOutput = z.output<typeof ratingFormSchema>;

export const EMPTY_RATING_FORM: RatingFormInput = { score: '', comment: '' };

export function ratingToFormValues(rating: Rating | null): RatingFormInput {
  if (!rating) return EMPTY_RATING_FORM;
  return { score: formatUserScore(rating.score), comment: rating.comment };
}

/** Snapshot guardado junto do favorito (pôster no tamanho de lista). */
export function detailsToSnapshot(movie: MovieDetails): MovieSnapshot {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    posterUrl: movie.posterThumbUrl,
    genres: movie.genres,
  };
}
