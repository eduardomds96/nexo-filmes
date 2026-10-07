import type { CastMember, Genre, Movie, MovieDetails, Page, Person } from '@nexo/contracts';

import {
  castMemberDtoSchema,
  crewMemberDtoSchema,
  genreDtoSchema,
  movieListItemDtoSchema,
  parseList,
} from './dto';
import type { GenreDto, MovieDetailsDto, MovieListItemDto, PagedDto } from './dto';
import { tmdbImageUrl } from './images';

/**
 * Camada anticorrupção: converte os DTOs da TMDB nos tipos de domínio do
 * Nexo Filmes. Nenhum componente conhece o formato da TMDB.
 */

export const CAST_LIMIT = 12;

/** A TMDB não serve páginas além da 500, mesmo quando `total_pages` é maior. */
export const TMDB_MAX_PAGE = 500;

export type GenreLookup = ReadonlyMap<number, Genre>;

export function toGenre(dto: GenreDto): Genre {
  return { id: dto.id, name: dto.name };
}

export function toGenres(items: readonly unknown[] | null | undefined): Genre[] {
  return parseList(items, genreDtoSchema)
    .map(toGenre)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function toGenreLookup(genres: readonly Genre[]): GenreLookup {
  return new Map(genres.map((genre) => [genre.id, genre]));
}

export function yearFromDate(date: string | null): number | null {
  const match = date ? /^(\d{4})-\d{2}-\d{2}$/.exec(date) : null;
  return match?.[1] ? Number(match[1]) : null;
}

/** Nota da TMDB limitada a 0–10, com uma casa decimal. */
export function toVoteAverage(value: number | null | undefined): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(10, Math.max(0, Math.round(value * 10) / 10));
}

export function toMovie(dto: MovieListItemDto, genres: GenreLookup): Movie {
  return {
    id: dto.id,
    title: dto.title,
    year: yearFromDate(dto.release_date),
    posterUrl: tmdbImageUrl(dto.poster_path, 'w342'),
    voteAverage: toVoteAverage(dto.vote_average),
    voteCount: dto.vote_count ?? 0,
    genres: (dto.genre_ids ?? []).flatMap((id) => {
      const genre = genres.get(id);
      return genre ? [genre] : [];
    }),
  };
}

export function toMoviePage(dto: PagedDto, genres: GenreLookup): Page<Movie> {
  return {
    page: dto.page,
    totalPages: Math.min(dto.total_pages, TMDB_MAX_PAGE),
    totalResults: dto.total_results,
    items: parseList(dto.results, movieListItemDtoSchema).map((item) => toMovie(item, genres)),
  };
}

function toDirectors(crew: readonly unknown[] | null | undefined): Person[] {
  const directors: Person[] = [];
  for (const member of parseList(crew, crewMemberDtoSchema)) {
    if (member.job === 'Director' && !directors.some((d) => d.id === member.id)) {
      directors.push({ id: member.id, name: member.name });
    }
  }
  return directors;
}

function toCast(cast: readonly unknown[] | null | undefined): CastMember[] {
  const last = Number.MAX_SAFE_INTEGER;
  return parseList(cast, castMemberDtoSchema)
    .sort((a, b) => (a.order ?? last) - (b.order ?? last))
    .slice(0, CAST_LIMIT)
    .map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character?.trim() ? member.character.trim() : null,
      profileUrl: tmdbImageUrl(member.profile_path, 'w185'),
    }));
}

export function toMovieDetails(dto: MovieDetailsDto): MovieDetails {
  return {
    id: dto.id,
    title: dto.title,
    year: yearFromDate(dto.release_date),
    posterUrl: tmdbImageUrl(dto.poster_path, 'w500'),
    posterThumbUrl: tmdbImageUrl(dto.poster_path, 'w342'),
    backdropUrl: tmdbImageUrl(dto.backdrop_path, 'w1280'),
    voteAverage: toVoteAverage(dto.vote_average),
    voteCount: dto.vote_count ?? 0,
    runtimeMinutes: dto.runtime && dto.runtime > 0 ? Math.round(dto.runtime) : null,
    overview: dto.overview?.trim() ?? '',
    tagline: dto.tagline?.trim() ? dto.tagline.trim() : null,
    genres: parseList(dto.genres, genreDtoSchema).map(toGenre),
    directors: toDirectors(dto.credits?.crew),
    cast: toCast(dto.credits?.cast),
  };
}
