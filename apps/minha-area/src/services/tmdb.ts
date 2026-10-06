import { createTmdbClient } from '@nexo/tmdb';
import type { TmdbClient } from '@nexo/tmdb';

let client: TmdbClient | null = null;

/** Cliente da TMDB deste micro-frontend, com o token lido do ambiente. */
export function getTmdbClient(): TmdbClient {
  // No modo simulado, quem responde é o MSW: o token não é verificado.
  const token =
    import.meta.env.VITE_TMDB_MOCK === 'true' ? 'modo-simulado' : import.meta.env.VITE_TMDB_TOKEN;
  client ??= createTmdbClient({ token });
  return client;
}
