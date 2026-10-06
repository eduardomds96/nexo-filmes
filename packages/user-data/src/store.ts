import type { FavoriteMovie, MovieSnapshot, Rating, RatingInput } from '@nexo/contracts';

import { emit, subscribe as subscribeEvent } from './events';
import type { LocalUserDataRepository } from './repository';
import { STORAGE_KEYS } from './schemas';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UserDataState {
  readonly status: LoadStatus;
  /** Favoritos com snapshot, já incluindo mudanças otimistas feitas por esta store. */
  readonly favorites: readonly FavoriteMovie[];
  /** Ids favoritados, incluindo mudanças otimistas vindas de qualquer micro-frontend. */
  readonly favoriteIds: ReadonlySet<number>;
  /** Ids com um toggle de favorito em andamento. */
  readonly pending: ReadonlySet<number>;
  readonly ratings: ReadonlyMap<number, Rating>;
}

export type ToggleFavoriteResult =
  | { readonly status: 'committed'; readonly favorited: boolean }
  | { readonly status: 'reverted'; readonly favorited: boolean; readonly error: unknown }
  /** Já havia um toggle pendente para o mesmo filme: nada foi feito. */
  | { readonly status: 'ignored' };

export interface UserDataStore {
  readonly getState: () => UserDataState;
  readonly subscribe: (listener: () => void) => () => void;
  /** Carrega favoritos e avaliações pelo repositório (com o atraso simulado). */
  readonly load: () => Promise<void>;
  readonly toggleFavorite: (movie: MovieSnapshot) => Promise<ToggleFavoriteResult>;
  readonly saveRating: (input: RatingInput) => Promise<Rating>;
  readonly deleteRating: (movieId: number) => Promise<void>;
  /** Remove os listeners de `window`. Usado em testes. */
  readonly dispose: () => void;
}

export interface UserDataStoreOptions {
  readonly repository: LocalUserDataRepository;
  readonly eventTarget?: EventTarget | null;
  /** Janela que dispara o evento `storage` (outras abas). `null` desliga. */
  readonly storageEventTarget?: EventTarget | null;
}

const INITIAL_STATE: UserDataState = {
  status: 'idle',
  favorites: [],
  favoriteIds: new Set(),
  pending: new Set(),
  ratings: new Map(),
};

function withId(set: ReadonlySet<number>, id: number, present: boolean): ReadonlySet<number> {
  if (set.has(id) === present) return set;
  const next = new Set(set);
  if (present) next.add(id);
  else next.delete(id);
  return next;
}

function toRatingMap(ratings: readonly Rating[]): ReadonlyMap<number, Rating> {
  return new Map(ratings.map((r) => [r.movieId, r]));
}

/**
 * Store dos dados do usuário, consumida via `useSyncExternalStore`.
 *
 * Coerência entre micro-frontends: quando este pacote é compartilhado como
 * singleton, todos usam a mesma store. Quando não é (remote rodando sozinho
 * ou com outra versão), cada store escuta os eventos `nexo:*` em `window` e
 * o evento `storage` (outras abas) e se ressincroniza.
 */
export function createUserDataStore(options: UserDataStoreOptions): UserDataStore {
  const { repository } = options;
  const defaultTarget = typeof window === 'undefined' ? null : window;
  const eventTarget = options.eventTarget === undefined ? defaultTarget : options.eventTarget;
  const storageTarget =
    options.storageEventTarget === undefined ? defaultTarget : options.storageEventTarget;

  let state = INITIAL_STATE;
  const listeners = new Set<() => void>();
  /** Snapshots das mudanças otimistas desta store, para adicionar/remover da lista. */
  const optimistic = new Map<number, MovieSnapshot>();
  let loading: Promise<void> | null = null;

  function setState(patch: Partial<UserDataState>): void {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  }

  /**
   * Relê o armazenamento sem atraso, preservando o estado otimista dos ids
   * que ainda estão pendentes.
   */
  function syncFromStorage(): void {
    const stored = repository.readFavoritesNow();
    let favorites: FavoriteMovie[] = stored;
    const favoriteIds = new Set(stored.map((f) => f.id));
    for (const id of state.pending) {
      const wanted = state.favoriteIds.has(id);
      if (wanted) favoriteIds.add(id);
      else favoriteIds.delete(id);
      const snapshot = optimistic.get(id);
      if (wanted && snapshot && !stored.some((f) => f.id === id)) {
        favorites = [{ ...snapshot, favoritedAt: new Date().toISOString() }, ...favorites];
      } else if (!wanted) {
        favorites = favorites.filter((f) => f.id !== id);
      }
    }
    setState({
      status: state.status === 'loading' ? 'loading' : 'ready',
      favorites,
      favoriteIds,
      ratings: toRatingMap(repository.readRatingsNow()),
    });
  }

  function applyOptimistic(movie: MovieSnapshot, favorited: boolean): void {
    const favorites = favorited
      ? [
          { ...movie, favoritedAt: new Date().toISOString() },
          ...state.favorites.filter((f) => f.id !== movie.id),
        ]
      : state.favorites.filter((f) => f.id !== movie.id);
    setState({ favorites, favoriteIds: withId(state.favoriteIds, movie.id, favorited) });
  }

  const cleanups: (() => void)[] = [];
  let listening = false;

  function startListening(): void {
    if (listening) return;
    listening = true;

    if (eventTarget) {
      cleanups.push(
        subscribeEvent(
          'nexo:favorites:changed',
          ({ movieId, favorited, status }) => {
            if (status === 'pending') {
              // Evento da própria store (já aplicado) ou de outra cópia do pacote.
              if (state.pending.has(movieId)) return;
              setState({
                pending: withId(state.pending, movieId, true),
                favoriteIds: withId(state.favoriteIds, movieId, favorited),
              });
              return;
            }
            if (!optimistic.has(movieId)) {
              setState({ pending: withId(state.pending, movieId, false) });
            }
            syncFromStorage();
          },
          eventTarget,
        ),
        subscribeEvent(
          'nexo:rating:changed',
          ({ movieId, rating }) => {
            const ratings = new Map(state.ratings);
            if (rating) ratings.set(movieId, rating);
            else ratings.delete(movieId);
            setState({ ratings });
          },
          eventTarget,
        ),
      );
    }

    if (storageTarget) {
      const onStorage = (event: Event) => {
        const key = (event as StorageEvent).key;
        if (key === null || key === STORAGE_KEYS.favorites || key === STORAGE_KEYS.ratings) {
          syncFromStorage();
        }
      };
      storageTarget.addEventListener('storage', onStorage);
      cleanups.push(() => {
        storageTarget.removeEventListener('storage', onStorage);
      });
    }
  }

  async function load(): Promise<void> {
    if (loading) return loading;
    startListening();
    setState({ status: 'loading' });
    loading = Promise.all([repository.listFavorites(), repository.listRatings()])
      .then(() => {
        // Os dados chegaram após o atraso simulado; a leitura síncrona
        // garante que mudanças feitas enquanto isso não sejam perdidas.
        state = { ...state, status: 'ready' };
        syncFromStorage();
      })
      .catch(() => {
        loading = null;
        setState({ status: 'error' });
      });
    return loading;
  }

  async function toggleFavorite(movie: MovieSnapshot): Promise<ToggleFavoriteResult> {
    if (state.pending.has(movie.id)) return { status: 'ignored' };
    startListening();

    const wasFavorite = state.favoriteIds.has(movie.id);
    const favorited = !wasFavorite;

    optimistic.set(movie.id, movie);
    setState({ pending: withId(state.pending, movie.id, true) });
    applyOptimistic(movie, favorited);
    if (eventTarget) {
      emit(
        'nexo:favorites:changed',
        { movieId: movie.id, favorited, status: 'pending' },
        eventTarget,
      );
    }

    try {
      const result = await repository.toggleFavorite(movie);
      optimistic.delete(movie.id);
      setState({ pending: withId(state.pending, movie.id, false) });
      syncFromStorage();
      return { status: 'committed', favorited: result.favorited };
    } catch (error) {
      optimistic.delete(movie.id);
      setState({ pending: withId(state.pending, movie.id, false) });
      applyOptimistic(movie, wasFavorite);
      if (eventTarget) {
        emit(
          'nexo:favorites:changed',
          { movieId: movie.id, favorited: wasFavorite, status: 'reverted' },
          eventTarget,
        );
      }
      return { status: 'reverted', favorited: wasFavorite, error };
    }
  }

  async function saveRating(input: RatingInput): Promise<Rating> {
    startListening();
    const rating = await repository.saveRating(input);
    const ratings = new Map(state.ratings);
    ratings.set(rating.movieId, rating);
    setState({ ratings });
    return rating;
  }

  async function deleteRating(movieId: number): Promise<void> {
    startListening();
    await repository.deleteRating(movieId);
    const ratings = new Map(state.ratings);
    ratings.delete(movieId);
    setState({ ratings });
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      if (state.status === 'idle') void load();
      return () => {
        listeners.delete(listener);
      };
    },
    load,
    toggleFavorite,
    saveRating,
    deleteRating,
    dispose: () => {
      for (const cleanup of cleanups.splice(0)) cleanup();
      listening = false;
      listeners.clear();
    },
  };
}
