import type {
  FavoriteMovie,
  MovieSnapshot,
  Rating,
  RatingInput,
  UserDataRepository,
} from '@nexo/contracts';

import { UserDataError } from './errors';
import { emit } from './events';
import { ratingInputSchema } from './rules';
import { favoriteMovieSchema, movieSnapshotSchema, ratingSchema, STORAGE_KEYS } from './schemas';
import { readList, writeList } from './storage';
import type { KeyValueStorage } from './storage';

export interface LocalRepositoryOptions {
  readonly storage: KeyValueStorage;
  /** Atraso simulado de cada operação, em ms. Use `0` nos testes. */
  readonly delay: number | (() => number);
  /** Indica se uma escrita no filme deve falhar. Use `() => false` nos testes. */
  readonly shouldFail: (movieId: number) => boolean;
  readonly now?: () => Date;
  /** Onde os eventos `nexo:*` são emitidos. `null` desliga a emissão. */
  readonly eventTarget?: EventTarget | null;
}

/** Repositório local que, além da interface assíncrona, permite leitura síncrona para sincronização. */
export interface LocalUserDataRepository extends UserDataRepository {
  /** Lê os favoritos direto do armazenamento, sem atraso. */
  readFavoritesNow(): FavoriteMovie[];
  /** Lê as avaliações direto do armazenamento, sem atraso. */
  readRatingsNow(): Rating[];
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function byMostRecent<T>(dateOf: (item: T) => string) {
  return (a: T, b: T) => dateOf(b).localeCompare(dateOf(a));
}

export function createLocalUserDataRepository(
  options: LocalRepositoryOptions,
): LocalUserDataRepository {
  const { storage, shouldFail } = options;
  const now = options.now ?? (() => new Date());
  const eventTarget =
    options.eventTarget === undefined
      ? typeof window === 'undefined'
        ? null
        : window
      : options.eventTarget;

  const wait = () => sleep(typeof options.delay === 'function' ? options.delay() : options.delay);

  const readFavorites = () => readList(storage, STORAGE_KEYS.favorites, favoriteMovieSchema);
  const readRatings = () => readList(storage, STORAGE_KEYS.ratings, ratingSchema);

  function assertWritable(movieId: number): void {
    if (shouldFail(movieId)) throw new UserDataError('simulated-failure');
  }

  return {
    readFavoritesNow: () => readFavorites().sort(byMostRecent((f) => f.favoritedAt)),
    readRatingsNow: () => readRatings().sort(byMostRecent((r) => r.updatedAt)),

    async listFavorites() {
      await wait();
      return readFavorites().sort(byMostRecent((f) => f.favoritedAt));
    },

    async toggleFavorite(movie: MovieSnapshot) {
      const snapshot = movieSnapshotSchema.safeParse(movie);
      if (!snapshot.success) throw new UserDataError('invalid-input', { cause: snapshot.error });

      await wait();
      assertWritable(movie.id);

      const favorites = readFavorites();
      const exists = favorites.some((f) => f.id === movie.id);
      const next: FavoriteMovie[] = exists
        ? favorites.filter((f) => f.id !== movie.id)
        : [{ ...snapshot.data, favoritedAt: now().toISOString() }, ...favorites];
      writeList(storage, STORAGE_KEYS.favorites, next);

      const favorited = !exists;
      if (eventTarget) {
        emit(
          'nexo:favorites:changed',
          { movieId: movie.id, favorited, status: 'committed' },
          eventTarget,
        );
      }
      return { favorited };
    },

    async getRating(movieId) {
      await wait();
      return readRatings().find((r) => r.movieId === movieId) ?? null;
    },

    async saveRating(input: RatingInput) {
      const parsed = ratingInputSchema.safeParse(input);
      if (!parsed.success) throw new UserDataError('invalid-input', { cause: parsed.error });

      await wait();
      assertWritable(input.movieId);

      const ratings = readRatings();
      const previous = ratings.find((r) => r.movieId === input.movieId);
      const timestamp = now().toISOString();
      const rating: Rating = {
        movieId: parsed.data.movieId,
        score: parsed.data.score,
        comment: parsed.data.comment?.trim() ?? '',
        createdAt: previous?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      // No máximo uma avaliação por filme: salvar de novo substitui a anterior.
      writeList(storage, STORAGE_KEYS.ratings, [
        rating,
        ...ratings.filter((r) => r.movieId !== input.movieId),
      ]);

      if (eventTarget)
        emit('nexo:rating:changed', { movieId: rating.movieId, rating }, eventTarget);
      return rating;
    },

    async deleteRating(movieId) {
      await wait();
      assertWritable(movieId);

      const ratings = readRatings();
      writeList(
        storage,
        STORAGE_KEYS.ratings,
        ratings.filter((r) => r.movieId !== movieId),
      );
      if (eventTarget) emit('nexo:rating:changed', { movieId, rating: null }, eventTarget);
    },

    async listRatings() {
      await wait();
      return readRatings().sort(byMostRecent((r) => r.updatedAt));
    },
  };
}
