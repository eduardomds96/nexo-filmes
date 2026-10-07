/**
 * Fixtures no formato da TMDB para testes e para o modo de dados simulados.
 * Nunca usados em produção.
 */

export interface MovieListItemFixture {
  id: number;
  title: string;
  release_date?: string | null;
  poster_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
}

export const genresFixture = [
  { id: 28, name: 'Ação' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 18, name: 'Drama' },
  { id: 878, name: 'Ficção científica' },
  { id: 27, name: 'Terror' },
];

export function movieListItem(overrides: Partial<MovieListItemFixture> & { id: number }) {
  return {
    title: `Filme ${String(overrides.id)}`,
    release_date: '2020-05-01',
    poster_path: `/poster-${String(overrides.id)}.jpg`,
    vote_average: 7.25,
    vote_count: 1000,
    genre_ids: [18],
    overview: 'Sinopse.',
    original_title: 'Original',
    ...overrides,
  };
}

export function moviePage(
  items: readonly ReturnType<typeof movieListItem>[],
  { page = 1, totalPages = 3, totalResults = 60 } = {},
) {
  return { page, total_pages: totalPages, total_results: totalResults, results: items };
}

/** Uma página com 20 filmes, com ids a partir de `firstId`. */
export function fullMoviePage(page = 1, firstId = 100) {
  const items = Array.from({ length: 20 }, (_, index) =>
    movieListItem({ id: firstId + (page - 1) * 20 + index }),
  );
  return moviePage(items, { page, totalPages: 10, totalResults: 200 });
}

export function movieDetails(overrides: Record<string, unknown> & { id: number }) {
  return {
    title: `Filme ${String(overrides.id)}`,
    release_date: '1999-10-15',
    poster_path: `/poster-${String(overrides.id)}.jpg`,
    backdrop_path: `/backdrop-${String(overrides.id)}.jpg`,
    vote_average: 8.4,
    vote_count: 25000,
    runtime: 139,
    overview: 'Um homem insone e um vendedor de sabonetes fundam um clube secreto.',
    tagline: 'Mischief. Mayhem. Soap.',
    genres: [{ id: 18, name: 'Drama' }],
    credits: {
      cast: [
        {
          id: 819,
          name: 'Edward Norton',
          character: 'Narrador',
          profile_path: '/norton.jpg',
          order: 0,
        },
        {
          id: 287,
          name: 'Brad Pitt',
          character: 'Tyler Durden',
          profile_path: '/pitt.jpg',
          order: 1,
        },
      ],
      crew: [
        { id: 7467, name: 'David Fincher', job: 'Director' },
        { id: 7469, name: 'Jim Uhls', job: 'Screenplay' },
      ],
    },
    ...overrides,
  };
}
