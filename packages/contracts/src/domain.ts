/**
 * Tipos de domínio do Nexo Filmes. Não refletem o formato da TMDB:
 * o adapter em @nexo/tmdb é a única peça que conhece os DTOs externos.
 */

export interface Genre {
  readonly id: number;
  readonly name: string;
}

export interface Movie {
  readonly id: number;
  readonly title: string;
  /** Ano de lançamento. `null` quando a TMDB não informa a data. */
  readonly year: number | null;
  /** URL absoluta do pôster para listas, ou `null` quando não há pôster. */
  readonly posterUrl: string | null;
  /** Nota média da TMDB, de 0 a 10. */
  readonly voteAverage: number;
  readonly voteCount: number;
  readonly genres: readonly Genre[];
}

export interface Person {
  readonly id: number;
  readonly name: string;
}

export interface CastMember extends Person {
  readonly character: string | null;
  readonly profileUrl: string | null;
}

export interface MovieDetails extends Omit<Movie, 'posterUrl'> {
  /** URL absoluta do pôster em tamanho de detalhe, ou `null`. */
  readonly posterUrl: string | null;
  /** URL do pôster em tamanho de lista, usada no snapshot de favoritos. */
  readonly posterThumbUrl: string | null;
  readonly runtimeMinutes: number | null;
  readonly overview: string;
  readonly tagline: string | null;
  readonly directors: readonly Person[];
  readonly cast: readonly CastMember[];
}

export interface Page<T> {
  readonly page: number;
  readonly totalPages: number;
  readonly totalResults: number;
  readonly items: readonly T[];
}
