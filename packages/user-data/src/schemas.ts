import { z } from 'zod';

import { ratingCommentSchema, ratingScoreSchema } from './rules';

/**
 * Formato persistido no localStorage. A versão faz parte da chave
 * (`nexo:v1:...`): uma mudança incompatível cria uma nova chave em vez de
 * reinterpretar dados antigos.
 */
export const STORAGE_KEYS = {
  favorites: 'nexo:v1:favorites',
  ratings: 'nexo:v1:ratings',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const genreSchema = z.object({ id: z.number().int(), name: z.string() });

export const favoriteMovieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  year: z.number().int().nullable(),
  posterUrl: z.string().nullable(),
  genres: z.array(genreSchema),
  favoritedAt: z.iso.datetime(),
});

export const ratingSchema = z.object({
  movieId: z.number().int().positive(),
  score: ratingScoreSchema,
  comment: ratingCommentSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const movieSnapshotSchema = favoriteMovieSchema.omit({ favoritedAt: true });
