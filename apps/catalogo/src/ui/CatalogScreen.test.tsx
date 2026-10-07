import { rateLimitedResponse, tmdbUrl } from '@nexo/tmdb/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../test/server';
import { renderRoute } from '@nexo/testing';
import { CatalogScreen } from './CatalogScreen';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));

function renderCatalog(initialEntry = '/filmes', options = {}) {
  return renderRoute(<CatalogScreen />, { path: '/filmes', initialEntry, ...options });
}

function countRequests(path: string) {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith(path)) urls.push(url);
  });
  return urls;
}

describe('CatalogScreen', () => {
  it('lista 20 filmes com título, ano, nota e gêneros', async () => {
    renderCatalog();

    expect(await screen.findByText('200 filmes encontrados.')).toBeDefined();
    const cards = screen.getAllByRole('listitem').filter((li) => within(li).queryByRole('heading'));
    expect(cards).toHaveLength(20);

    const first = cards[0]!;
    expect(within(first).getByRole('link', { name: 'Filme 100' }).getAttribute('href')).toBe(
      '/filme/100',
    );
    expect(within(first).getByText('2020')).toBeDefined();
    expect(within(first).getByText('Nota da TMDB: 7,3 de 10')).toBeDefined();
    expect(within(first).getByText('Drama')).toBeDefined();
  });

  it('lê busca, gênero e página da URL ao abrir', async () => {
    const searches = countRequests('/search/movie');
    renderCatalog('/filmes?q=matrix&genero=28&pagina=2');

    expect(screen.getByLabelText<HTMLInputElement>('Buscar por título').value).toBe('matrix');
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLSelectElement>('Gênero').value).toBe('28');
    });
    await waitFor(() => {
      expect(searches).toHaveLength(1);
    });
    expect(searches[0]?.searchParams.get('query')).toBe('matrix');
    expect(searches[0]?.searchParams.get('page')).toBe('2');
    expect(screen.getByText(/A busca por título da TMDB não filtra por gênero/)).toBeDefined();
  });

  it('busca + gênero mostra só os resultados do gênero e avisa sobre a paginação', async () => {
    renderCatalog('/filmes?q=duna&genero=28');
    expect(
      await screen.findByText('2 filmes de Ação nesta página da busca (3 resultados no total).'),
    ).toBeDefined();
    expect(screen.getByRole('link', { name: 'duna 1' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'duna 2' })).toBeNull();
  });

  it('trocar o gênero escreve na URL e volta para a página 1', async () => {
    const user = userEvent.setup();
    const { search } = renderCatalog('/filmes?pagina=3');
    await screen.findByText('200 filmes encontrados.');

    await user.selectOptions(screen.getByLabelText('Gênero'), 'Drama');

    expect(search()).toEqual({ genero: '18' });
  });

  it('não faz uma requisição por tecla: busca o termo completo depois da pausa', async () => {
    const user = userEvent.setup();
    const searches = countRequests('/search/movie');
    const { search } = renderCatalog();
    await screen.findByText('200 filmes encontrados.');

    await user.type(screen.getByLabelText('Buscar por título'), 'matrix');

    await waitFor(() => {
      expect(search()).toEqual({ q: 'matrix' });
    });
    await screen.findByText('3 filmes encontrados.');
    // A regra exata dos 400 ms é testada com relógio falso em
    // use-debounced-callback.test.ts; aqui, sob carga, uma pausa entre teclas
    // pode legitimamente disparar uma busca intermediária.
    expect(searches.length).toBeLessThan('matrix'.length - 1);
    expect(searches.at(-1)?.searchParams.get('query')).toBe('matrix');
  });

  it('cancela a requisição anterior quando a busca muda', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(tmdbUrl('/search/movie'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return HttpResponse.json({ page: 1, total_pages: 1, total_results: 0, results: [] });
      }),
    );
    // Sinais entregues ao fetch das buscas: é o que cancela a requisição HTTP.
    const signals: AbortSignal[] = [];
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      if (
        (input instanceof Request ? input.url : input.toString()).includes('/search/movie') &&
        init?.signal
      )
        signals.push(init.signal);
      return realFetch(input, init);
    });
    renderCatalog();
    await screen.findByText('200 filmes encontrados.');
    const input = screen.getByLabelText('Buscar por título');

    await user.type(input, 'ma');
    await waitFor(() => {
      expect(signals).toHaveLength(1);
    });
    await user.type(input, 't');
    await waitFor(() => {
      expect(signals).toHaveLength(2);
    });

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('erro 429 mostra mensagem clara, não repete sozinho e "Tentar novamente" funciona', async () => {
    const user = userEvent.setup();
    const discovers = countRequests('/discover/movie');
    let limited = true;
    server.use(
      http.get(tmdbUrl('/discover/movie'), () =>
        limited
          ? rateLimitedResponse()
          : HttpResponse.json({
              page: 1,
              total_pages: 1,
              total_results: 1,
              results: [{ id: 7, title: 'Voltou', genre_ids: [] }],
            }),
      ),
    );
    renderCatalog();

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Muitas requisições')).toBeDefined();
    expect(within(alert).getByText(/Aguarde alguns segundos/)).toBeDefined();
    expect(discovers).toHaveLength(1);

    limited = false;
    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('link', { name: 'Voltou' })).toBeDefined();
    expect(discovers).toHaveLength(2);
  });

  it('mostra estado vazio com ação para limpar filtros', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(tmdbUrl('/search/movie'), () =>
        HttpResponse.json({ page: 1, total_pages: 0, total_results: 0, results: [] }),
      ),
    );
    const { search } = renderCatalog('/filmes?q=zzzz');

    expect(await screen.findByText('Nenhum filme encontrado')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(search()).toEqual({});
  });

  it('pagina por links que preservam a busca na URL', async () => {
    renderCatalog('/filmes?genero=18');
    await screen.findByText('200 filmes encontrados.');
    const nav = screen.getByRole('navigation', { name: 'Paginação' });
    expect(within(nav).getByRole('link', { name: 'Próxima página' }).getAttribute('href')).toBe(
      '/filmes?genero=18&pagina=2',
    );
    expect(within(nav).getByRole('link', { name: 'Página 1' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('favorita direto no card, com atualização otimista', async () => {
    const user = userEvent.setup();
    const { store } = renderCatalog();
    await screen.findByText('200 filmes encontrados.');

    const button = screen.getByRole('button', { name: 'Adicionar Filme 100 aos favoritos' });
    await user.click(button);

    await waitFor(() => {
      expect(store.getState().favoriteIds.has(100)).toBe(true);
    });
    expect(
      screen
        .getByRole('button', { name: 'Remover Filme 100 dos favoritos' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('desfaz o favorito e avisa quando o salvamento falha', async () => {
    const user = userEvent.setup();
    const { store } = renderCatalog('/filmes', { repository: { shouldFail: () => true } });
    await screen.findByText('200 filmes encontrados.');

    await user.click(screen.getByRole('button', { name: 'Adicionar Filme 100 aos favoritos' }));

    await waitFor(() => {
      expect(store.getState().pending.size).toBe(0);
    });
    expect(store.getState().favoriteIds.has(100)).toBe(false);
    expect(
      screen
        .getByRole('button', { name: 'Adicionar Filme 100 aos favoritos' })
        .getAttribute('aria-pressed'),
    ).toBe('false');
    expect(toastError).toHaveBeenCalledWith(
      'Não foi possível salvar "Filme 100" nos favoritos.',
      expect.objectContaining({ description: expect.stringContaining('desfeita') as unknown }),
    );
  });
});
