import type { Rating } from './user-data';

export type FavoriteChangeStatus = 'pending' | 'committed' | 'reverted';

/**
 * Eventos trocados entre micro-frontends via `CustomEvent` em `window`.
 * Os helpers `emit`/`subscribe` tipados ficam em @nexo/user-data.
 */
export interface NexoEventMap {
  'nexo:favorites:changed': {
    readonly movieId: number;
    readonly favorited: boolean;
    readonly status: FavoriteChangeStatus;
  };
  'nexo:rating:changed': {
    readonly movieId: number;
    readonly rating: Rating | null;
  };
}

export type NexoEventName = keyof NexoEventMap;
