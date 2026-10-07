import { delay, http, HttpResponse } from 'msw';

import { TMDB_API_BASE_URL } from '../client';
import { TMDB_IMAGE_BASE_URL } from '../images';
import { rateLimitedResponse } from './handlers';
import {
  DEMO_GENRES,
  DEMO_MOVIES,
  DEMO_RATE_LIMIT_QUERY,
  demoDetails,
  demoImageSvg,
  normalizeText,
  paginate,
} from './demo-data';

const api = (path: string) => `${TMDB_API_BASE_URL}${path}`;

function pageParam(url: URL): number {
  const page = Number(url.searchParams.get('page') ?? '1');
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/**
 * Handlers que simulam a TMDB com o catálogo de demonstração: busca por
 * título (sem acentos), filtro de gênero no discover, detalhe com créditos,
 * pôsteres, fundos e fotos em SVG e um 429 sob demanda (buscar por "erro429").
 */
export function createDemoHandlers({ latencyMs = 250 }: { latencyMs?: number } = {}) {
  return [
    http.get(api('/genre/movie/list'), async () => {
      await delay(latencyMs);
      return HttpResponse.json({ genres: DEMO_GENRES });
    }),

    http.get(api('/discover/movie'), async ({ request }) => {
      await delay(latencyMs);
      const url = new URL(request.url);
      const genre = Number(url.searchParams.get('with_genres'));
      const movies = genre
        ? DEMO_MOVIES.filter((movie) => movie.genre_ids.includes(genre))
        : DEMO_MOVIES;
      return HttpResponse.json(paginate(movies, pageParam(url)));
    }),

    http.get(api('/search/movie'), async ({ request }) => {
      await delay(latencyMs);
      const url = new URL(request.url);
      const query = normalizeText(url.searchParams.get('query') ?? '');
      if (query === DEMO_RATE_LIMIT_QUERY) return rateLimitedResponse();
      const movies = DEMO_MOVIES.filter((movie) => normalizeText(movie.title).includes(query));
      return HttpResponse.json(paginate(movies, pageParam(url)));
    }),

    http.get(api('/movie/:id'), async ({ params }) => {
      await delay(latencyMs);
      const movie = DEMO_MOVIES.find((m) => m.id === Number(params['id']));
      if (!movie) {
        return HttpResponse.json(
          { status_code: 34, status_message: 'The resource you requested could not be found.' },
          { status: 404 },
        );
      }
      return HttpResponse.json(demoDetails(movie));
    }),

    http.get(`${TMDB_IMAGE_BASE_URL}/:size/demo/:file`, ({ params }) => {
      return new HttpResponse(demoImageSvg(String(params['file'])), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=3600' },
      });
    }),
  ];
}
