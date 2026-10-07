import type { Genre } from './domain';

/** Cópia mínima de um filme, guardada junto do favorito para não depender da TMDB. */
export interface MovieSnapshot {
  readonly id: number;
  readonly title: string;
  readonly year: number | null;
  readonly posterUrl: string | null;
  readonly genres: readonly Genre[];
}

export interface FavoriteMovie extends MovieSnapshot {
  /** Data ISO 8601 em que o filme foi favoritado. */
  readonly favoritedAt: string;
}

export interface Rating {
  readonly movieId: number;
  /** Nota de 0,5 a 10, em passos de 0,5. */
  readonly score: number;
  /** Comentário opcional, até 500 caracteres. String vazia quando ausente. */
  readonly comment: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /**
   * Cópia mínima do filme avaliado, para listar avaliações sem depender da
   * TMDB. `null` em avaliações gravadas antes de o snapshot existir.
   */
  readonly movie: MovieSnapshot | null;
}

export interface RatingInput {
  readonly movieId: number;
  readonly score: number;
  readonly comment?: string;
  /** Snapshot do filme. Sem ele, a avaliação mantém o snapshot que já tinha. */
  readonly movie?: MovieSnapshot;
}

/** Repositório assíncrono que simula um back-end para os dados do usuário. */
export interface UserDataRepository {
  listFavorites(): Promise<FavoriteMovie[]>;
  toggleFavorite(movie: MovieSnapshot): Promise<{ favorited: boolean }>;
  getRating(movieId: number): Promise<Rating | null>;
  saveRating(input: RatingInput): Promise<Rating>;
  deleteRating(movieId: number): Promise<void>;
  listRatings(): Promise<Rating[]>;
}
