import { movieDetails, rateLimitedResponse, tmdbUrl } from '@nexo/tmdb/testing';
import { renderRoute } from '@nexo/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../test/server';
import { MovieScreen } from './MovieScreen';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));

function renderMovie(id: string, options = {}) {
  return renderRoute(<MovieScreen />, {
    path: '/filme/:id',
    initialEntry: `/filme/${id}`,
    ...options,
  });
}

describe('MovieScreen', () => {
  it('mostra pôster, título, ano, duração, gêneros, nota, sinopse, direção e elenco', async () => {
    renderMovie('550');

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Filme 550(1999)');
    expect(document.title).toBe('Filme 550 · Nexo Filmes');
    expect(screen.getByRole('img', { name: 'Pôster do filme Filme 550' }).getAttribute('src')).toBe(
      'https://image.tmdb.org/t/p/w500/poster-550.jpg',
    );
    expect(screen.getByText('2 horas e 19 minutos')).toBeDefined();
    expect(screen.getByText('Drama')).toBeDefined();
    expect(screen.getByText('Nota da TMDB: 8,4 de 10')).toBeDefined();
    expect(screen.getByText(/vendedor de sabonetes/)).toBeDefined();
    expect(screen.getByText('David Fincher')).toBeDefined();

    const cast = screen.getByRole('region', { name: 'Elenco' });
    expect(within(cast).getByText('Edward Norton')).toBeDefined();
    expect(within(cast).getByText('Tyler Durden')).toBeDefined();
  });

  it('sem diretor, sem pôster e sem sinopse mostra textos neutros', async () => {
    server.use(
      http.get(tmdbUrl('/movie/:id'), () =>
        HttpResponse.json(
          movieDetails({ id: 7, poster_path: null, overview: '', credits: { cast: [], crew: [] } }),
        ),
      ),
    );
    renderMovie('7');

    expect(await screen.findByText('Direção não informada.')).toBeDefined();
    expect(screen.getByRole('img', { name: 'Pôster indisponível: Filme 7' })).toBeDefined();
    expect(screen.getByText('Sinopse não disponível em português.')).toBeDefined();
    expect(screen.getByText('Elenco não informado.')).toBeDefined();
  });

  it('id inválido mostra "Filme não encontrado" sem chamar a API', async () => {
    const spy = vi.fn();
    server.events.on('request:start', spy);
    renderMovie('abc');
    expect(screen.getByRole('heading', { name: 'Filme não encontrado' })).toBeDefined();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(spy).not.toHaveBeenCalled();
  });

  it('404 da TMDB mostra "Filme não encontrado"', async () => {
    server.use(http.get(tmdbUrl('/movie/:id'), () => HttpResponse.json({}, { status: 404 })));
    renderMovie('999');
    expect(await screen.findByRole('heading', { name: 'Filme não encontrado' })).toBeDefined();
  });

  it('429 mostra mensagem clara e "Tentar novamente" refaz a busca', async () => {
    const user = userEvent.setup();
    let limited = true;
    server.use(
      http.get(tmdbUrl('/movie/:id'), () =>
        limited ? rateLimitedResponse() : HttpResponse.json(movieDetails({ id: 550 })),
      ),
    );
    renderMovie('550');

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Muitas requisições')).toBeDefined();
    limited = false;
    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('David Fincher')).toBeDefined();
  });

  it('favorita e desfavorita no detalhe', async () => {
    const user = userEvent.setup();
    const { store } = renderMovie('550');

    await user.click(
      await screen.findByRole('button', { name: 'Adicionar Filme 550 aos favoritos' }),
    );
    await waitFor(() => {
      expect(store.getState().favorites.map((f) => f.id)).toEqual([550]);
    });
    // O snapshot guarda o pôster de lista.
    expect(store.getState().favorites[0]?.posterUrl).toBe(
      'https://image.tmdb.org/t/p/w342/poster-550.jpg',
    );

    await user.click(screen.getByRole('button', { name: 'Remover Filme 550 dos favoritos' }));
    await waitFor(() => {
      expect(store.getState().favoriteIds.size).toBe(0);
    });
  });

  it('falha ao favoritar id terminado em 13: volta atrás e avisa', async () => {
    const user = userEvent.setup();
    const { store } = renderMovie('413', {
      repository: { shouldFail: (id: number) => String(id).endsWith('13') },
    });

    await user.click(
      await screen.findByRole('button', { name: 'Adicionar Filme 413 aos favoritos' }),
    );

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
    expect(store.getState().favoriteIds.has(413)).toBe(false);
    expect(screen.getByRole('button', { name: 'Adicionar Filme 413 aos favoritos' })).toBeDefined();
  });
});
