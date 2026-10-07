import { z } from 'zod';

/**
 * Schemas dos DTOs da TMDB. São tolerantes de propósito: campos opcionais
 * ausentes viram `null`, e um item inválido numa lista é descartado em vez
 * de derrubar a página inteira (ver `parseList`).
 */

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

export const genreDtoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
export type GenreDto = z.infer<typeof genreDtoSchema>;

export const genreListDtoSchema = z.object({
  genres: z.array(z.unknown()),
});

export const movieListItemDtoSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  release_date: nullableString,
  poster_path: nullableString,
  vote_average: z.number().nullish(),
  vote_count: z.number().nullish(),
  genre_ids: z.array(z.number().int()).nullish(),
});
export type MovieListItemDto = z.infer<typeof movieListItemDtoSchema>;

export const pagedDtoSchema = z.object({
  page: z.number().int(),
  total_pages: z.number().int(),
  total_results: z.number().int(),
  results: z.array(z.unknown()),
});
export type PagedDto = z.infer<typeof pagedDtoSchema>;

export const castMemberDtoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  character: nullableString,
  profile_path: nullableString,
  order: z.number().nullish(),
});
export type CastMemberDto = z.infer<typeof castMemberDtoSchema>;

export const crewMemberDtoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  job: nullableString,
});
export type CrewMemberDto = z.infer<typeof crewMemberDtoSchema>;

export const movieDetailsDtoSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  release_date: nullableString,
  poster_path: nullableString,
  backdrop_path: nullableString,
  vote_average: z.number().nullish(),
  vote_count: z.number().nullish(),
  runtime: z.number().nullish(),
  overview: nullableString,
  tagline: nullableString,
  genres: z.array(z.unknown()).nullish(),
  credits: z
    .object({
      cast: z.array(z.unknown()).nullish(),
      crew: z.array(z.unknown()).nullish(),
    })
    .nullish(),
});
export type MovieDetailsDto = z.infer<typeof movieDetailsDtoSchema>;

export function parseList<T>(
  items: readonly unknown[] | null | undefined,
  schema: z.ZodType<T>,
): T[] {
  const parsed: T[] = [];
  for (const item of items ?? []) {
    const result = schema.safeParse(item);
    if (result.success) parsed.push(result.data);
  }
  return parsed;
}
