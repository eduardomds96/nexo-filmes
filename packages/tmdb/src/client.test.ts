import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createTmdbClient } from './client';
import { TmdbError, isRetryableTmdbError } from './errors';
import { rateLimitedResponse, tmdbHandlers, tmdbUrl } from './testing/handlers';

const server = setupServer(...tmdbHandlers);

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

const client = () => createTmdbClient({ token: 'token-de-teste' });

describe('createTmdbClient', () => {
  it('envia token, idioma pt-BR e parâmetros do discover', async () => {
    let captured: Request | undefined;
    server.use(
      http.get(tmdbUrl('/discover/movie'), ({ request }) => {
        captured = request;
        return HttpResponse.json({ page: 2, total_pages: 1, total_results: 0, results: [] });
      }),
    );

    await client().discoverMovies({ page: 2, genreId: 18 });

    expect(captured?.headers.get('Authorization')).toBe('Bearer token-de-teste');
    const url = new URL(captured?.url ?? '');
    expect(url.searchParams.get('language')).toBe('pt-BR');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('with_genres')).toBe('18');
  });

  it('não envia with_genres quando não há gênero', async () => {
    let url: URL | undefined;
    server.use(
      http.get(tmdbUrl('/discover/movie'), ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ page: 1, total_pages: 1, total_results: 0, results: [] });
      }),
    );
    await client().discoverMovies({ page: 1, genreId: null });
    expect(url?.searchParams.has('with_genres')).toBe(false);
  });

  it('converte a página para o domínio com os nomes dos gêneros', async () => {
    const page = await client().discoverMovies({ page: 1 });
    expect(page.items).toHaveLength(20);
    expect(page.items[0]?.genres).toEqual([{ id: 18, name: 'Drama' }]);
    expect(page.totalPages).toBe(10);
  });

  it('busca por título com o termo sem espaços nas pontas', async () => {
    let query: string | null = null;
    server.use(
      http.get(tmdbUrl('/search/movie'), ({ request }) => {
        query = new URL(request.url).searchParams.get('query');
        return HttpResponse.json({ page: 1, total_pages: 1, total_results: 0, results: [] });
      }),
    );
    await client().searchMovies({ query: '  matrix ', page: 1 });
    expect(query).toBe('matrix');
  });

  it('busca os gêneros uma única vez por cliente', async () => {
    const spy = vi.fn();
    server.use(
      http.get(tmdbUrl('/genre/movie/list'), () => {
        spy();
        return HttpResponse.json({ genres: [{ id: 18, name: 'Drama' }] });
      }),
    );
    const tmdb = client();
    await Promise.all([tmdb.getGenres(), tmdb.discoverMovies({ page: 1 })]);
    await tmdb.searchMovies({ query: 'x', page: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('não guarda em cache uma falha ao buscar gêneros', async () => {
    let calls = 0;
    server.use(
      http.get(tmdbUrl('/genre/movie/list'), () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json({ genres: [] });
      }),
    );
    const tmdb = client();
    await expect(tmdb.getGenres()).rejects.toMatchObject({ kind: 'server' });
    await expect(tmdb.getGenres()).resolves.toEqual([]);
  });

  it('pede o detalhe com credits anexados', async () => {
    let append: string | null = null;
    server.use(
      http.get(tmdbUrl('/movie/:id'), ({ request }) => {
        append = new URL(request.url).searchParams.get('append_to_response');
        return HttpResponse.json({ id: 550, title: 'Clube da Luta' });
      }),
    );
    const details = await client().getMovieDetails(550);
    expect(append).toBe('credits');
    expect(details.title).toBe('Clube da Luta');
  });

  describe('erros', () => {
    it('429 vira rate-limit com Retry-After e não é repetível', async () => {
      server.use(http.get(tmdbUrl('/movie/:id'), () => rateLimitedResponse()));
      const error = await client()
        .getMovieDetails(1)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TmdbError);
      expect(error).toMatchObject({ kind: 'rate-limit', status: 429, retryAfterSeconds: 2 });
      expect(isRetryableTmdbError(error)).toBe(false);
    });

    it.each([
      [401, 'unauthorized'],
      [404, 'not-found'],
      [500, 'server'],
      [503, 'server'],
    ] as const)('status %i vira %s', async (status, kind) => {
      server.use(http.get(tmdbUrl('/movie/:id'), () => HttpResponse.json({}, { status })));
      await expect(client().getMovieDetails(1)).rejects.toMatchObject({ kind, status });
    });

    it('falha de rede vira network e é repetível', async () => {
      server.use(http.get(tmdbUrl('/movie/:id'), () => HttpResponse.error()));
      const error = await client()
        .getMovieDetails(1)
        .catch((e: unknown) => e);
      expect(error).toMatchObject({ kind: 'network' });
      expect(isRetryableTmdbError(error)).toBe(true);
    });

    it('resposta fora do schema vira invalid-response', async () => {
      server.use(http.get(tmdbUrl('/movie/:id'), () => HttpResponse.json({ id: 'abc' })));
      await expect(client().getMovieDetails(1)).rejects.toMatchObject({
        kind: 'invalid-response',
      });
    });

    it('corpo que não é JSON vira invalid-response', async () => {
      server.use(
        http.get(tmdbUrl('/movie/:id'), () => new HttpResponse('<html>', { status: 200 })),
      );
      await expect(client().getMovieDetails(1)).rejects.toMatchObject({
        kind: 'invalid-response',
      });
    });

    it('sem token falha sem chamar a rede', async () => {
      const fetchSpy = vi.fn<typeof fetch>();
      const tmdb = createTmdbClient({ token: '  ', fetch: fetchSpy });
      await expect(tmdb.getMovieDetails(1)).rejects.toMatchObject({ kind: 'missing-token' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('propaga o cancelamento como AbortError', async () => {
      const controller = new AbortController();
      controller.abort();
      const error = await client()
        .getMovieDetails(1, controller.signal)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe('AbortError');
    });
  });
});
