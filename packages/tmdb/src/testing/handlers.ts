import { http, HttpResponse } from 'msw/http';

import { TMDB_API_BASE_URL } from '../client';
import { fullMoviePage, genresFixture, movieDetails, movieListItem, moviePage } from './fixtures';

export const tmdbUrl = (path: string) => `${TMDB_API_BASE_URL}${path}`;

/**
 * Handlers MSW que simulam a TMDB. Cobrem o caminho feliz; cada teste
 * sobrescreve o que precisar com `server.use(...)`.
 */
export const tmdbHandlers = [
  http.get(tmdbUrl('/genre/movie/list'), () => HttpResponse.json({ genres: genresFixture })),

  http.get(tmdbUrl('/discover/movie'), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    return HttpResponse.json(fullMoviePage(page));
  }),

  http.get(tmdbUrl('/search/movie'), ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') ?? '';
    const page = Number(url.searchParams.get('page') ?? '1');
    const items = [
      movieListItem({ id: 501, title: `${query} 1`, genre_ids: [28] }),
      movieListItem({ id: 502, title: `${query} 2`, genre_ids: [18] }),
      movieListItem({ id: 503, title: `${query} 3`, genre_ids: [28, 18] }),
    ];
    return HttpResponse.json(moviePage(items, { page, totalPages: 1, totalResults: 3 }));
  }),

  http.get(tmdbUrl('/movie/:id'), ({ params }) => {
    const id = Number(params['id']);
    if (!Number.isInteger(id) || id <= 0) {
      return HttpResponse.json({ status_message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(movieDetails({ id }));
  }),
];

export function rateLimitedResponse() {
  return HttpResponse.json(
    { status_code: 25, status_message: 'Your request count is over the allowed limit.' },
    { status: 429, headers: { 'Retry-After': '2' } },
  );
}
