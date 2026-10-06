import type { FavoriteMovie, MovieSnapshot, Rating } from '@nexo/contracts';
import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import { getDefaultUserDataStore } from './default-store';
import type { LoadStatus, ToggleFavoriteResult, UserDataState, UserDataStore } from './store';

const UserDataContext = createContext<UserDataStore | null>(null);

/** Injeta uma store específica (útil em testes). Sem provider, usa a store padrão da página. */
export function UserDataProvider({
  store,
  children,
}: {
  store: UserDataStore;
  children: ReactNode;
}) {
  return <UserDataContext value={store}>{children}</UserDataContext>;
}

export function useUserDataStore(): UserDataStore {
  return useContext(UserDataContext) ?? getDefaultUserDataStore();
}

function useSelector<T>(selector: (state: UserDataState) => T): T {
  const store = useUserDataStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

export function useUserDataStatus(): LoadStatus {
  return useSelector((s) => s.status);
}

export function useFavorites(): readonly FavoriteMovie[] {
  return useSelector((s) => s.favorites);
}

export function useFavoritesCount(): number {
  return useSelector((s) => s.favoriteIds.size);
}

export function useIsFavorite(movieId: number): boolean {
  return useSelector((s) => s.favoriteIds.has(movieId));
}

export function useIsFavoritePending(movieId: number): boolean {
  return useSelector((s) => s.pending.has(movieId));
}

export function useRatings(): ReadonlyMap<number, Rating> {
  return useSelector((s) => s.ratings);
}

export function useRating(movieId: number): Rating | null {
  return useSelector((s) => s.ratings.get(movieId) ?? null);
}

export interface UseFavoriteOptions {
  /** Chamado quando o salvamento falha e a mudança otimista é desfeita. */
  readonly onReverted?: (result: Extract<ToggleFavoriteResult, { status: 'reverted' }>) => void;
}

export interface FavoriteControl {
  readonly isFavorite: boolean;
  readonly isPending: boolean;
  readonly toggle: () => Promise<ToggleFavoriteResult>;
}

/** Estado e ação de favorito de um filme, com atualização otimista. */
export function useFavorite(
  movie: MovieSnapshot,
  options: UseFavoriteOptions = {},
): FavoriteControl {
  const store = useUserDataStore();
  const isFavorite = useIsFavorite(movie.id);
  const isPending = useIsFavoritePending(movie.id);
  const { onReverted } = options;

  const toggle = useCallback(async () => {
    const result = await store.toggleFavorite(movie);
    if (result.status === 'reverted') onReverted?.(result);
    return result;
  }, [store, movie, onReverted]);

  return { isFavorite, isPending, toggle };
}
