import type { Genre, Movie, MovieDetails, Page } from '@nexo/contracts';
import type { z } from 'zod';

import { toGenreLookup, toGenres, toMovieDetails, toMoviePage } from './adapter';
import { genreListDtoSchema, movieDetailsDtoSchema, pagedDtoSchema } from './dto';
import { isAbortError, TmdbError } from './errors';

export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

export interface TmdbClientOptions {
  /** Token de leitura (v4) da TMDB. Ausente: toda chamada falha com `missing-token`. */
  readonly token: string | undefined;
  readonly baseUrl?: string;
  readonly language?: string;
  readonly fetch?: typeof fetch;
}

export interface DiscoverParams {
  readonly page: number;
  readonly genreId?: number | null;
}

export interface SearchParams {
  readonly query: string;
  readonly page: number;
}

export interface TmdbClient {
  /** Lista de gêneros, buscada uma única vez por cliente e guardada em memória. */
  getGenres(): Promise<Genre[]>;
  discoverMovies(params: DiscoverParams, signal?: AbortSignal): Promise<Page<Movie>>;
  searchMovies(params: SearchParams, signal?: AbortSignal): Promise<Page<Movie>>;
  getMovieDetails(id: number, signal?: AbortSignal): Promise<MovieDetails>;
}

type QueryValue = string | number | null | undefined;

function parseRetryAfter(header: string | null): number | null {
  if (header === null) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function errorFromStatus(response: Response): TmdbError {
  const { status } = response;
  if (status === 429) {
    return new TmdbError('rate-limit', {
      status,
      retryAfterSeconds: parseRetryAfter(response.headers.get('Retry-After')),
    });
  }
  if (status === 401 || status === 403) return new TmdbError('unauthorized', { status });
  if (status === 404) return new TmdbError('not-found', { status });
  return new TmdbError('server', { status });
}

export function createTmdbClient(options: TmdbClientOptions): TmdbClient {
  const baseUrl = options.baseUrl ?? TMDB_API_BASE_URL;
  const language = options.language ?? 'pt-BR';
  const doFetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  async function request<T>(
    path: string,
    query: Record<string, QueryValue>,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const token = options.token?.trim();
    if (!token) throw new TmdbError('missing-token');

    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set('language', language);
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    let response: Response;
    try {
      response = await doFetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: signal ?? null,
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new TmdbError('network', { cause: error });
    }

    if (!response.ok) throw errorFromStatus(response);

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new TmdbError('invalid-response', { status: response.status, cause: error });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new TmdbError('invalid-response', { status: response.status, cause: parsed.error });
    }
    return parsed.data;
  }

  let genresPromise: Promise<Genre[]> | null = null;

  function getGenres(): Promise<Genre[]> {
    if (!genresPromise) {
      const loading = request('/genre/movie/list', {}, genreListDtoSchema).then((dto) =>
        toGenres(dto.genres),
      );
      genresPromise = loading;
      // Uma falha não fica em cache: a próxima chamada tenta de novo.
      loading.catch(() => {
        if (genresPromise === loading) genresPromise = null;
      });
    }
    return genresPromise;
  }

  return {
    getGenres,

    async discoverMovies({ page, genreId }, signal) {
      const [genres, dto] = await Promise.all([
        getGenres(),
        request(
          '/discover/movie',
          {
            page,
            with_genres: genreId ?? null,
            sort_by: 'popularity.desc',
            include_adult: 'false',
          },
          pagedDtoSchema,
          signal,
        ),
      ]);
      return toMoviePage(dto, toGenreLookup(genres));
    },

    async searchMovies({ query, page }, signal) {
      const [genres, dto] = await Promise.all([
        getGenres(),
        request(
          '/search/movie',
          { query: query.trim(), page, include_adult: 'false' },
          pagedDtoSchema,
          signal,
        ),
      ]);
      return toMoviePage(dto, toGenreLookup(genres));
    },

    async getMovieDetails(id, signal) {
      const dto = await request(
        `/movie/${String(id)}`,
        { append_to_response: 'credits' },
        movieDetailsDtoSchema,
        signal,
      );
      return toMovieDetails(dto);
    },
  };
}
