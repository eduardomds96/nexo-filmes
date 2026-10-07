import type { MovieSnapshot } from '@nexo/contracts';
import { renderRoute } from '@nexo/testing';
import { createMemoryStorage, STORAGE_KEYS } from '@nexo/user-data';
import { act, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RatingsScreen } from './RatingsScreen';

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

function movie(id: number, title: string, year = 2001): MovieSnapshot {
  return { id, title, year, posterUrl: null, genres: [{ id: 18, name: 'Drama' }] };
}

function renderRatings(initialEntry = '/avaliacoes', options = {}) {
  return renderRoute(<RatingsScreen />, { path: '/avaliacoes', initialEntry, ...options });
}

const titles = () =>
  screen.getAllByRole('heading', { level: 2 }).map((h) => within(h).getByRole('link').textContent);

describe('RatingsScreen', () => {
  it('mostra estado vazio com link para o catálogo', async () => {
    renderRatings();
    expect(await screen.findByText('Você ainda não avaliou nenhum filme')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Explorar filmes' }).getAttribute('href')).toBe(
      '/filmes',
    );
  });

  it('lista título, ano, nota, comentário e data, com resumo e média', async () => {
    const { store } = renderRatings();
    await act(async () => {
      await store.saveRating({
        movieId: 1,
        score: 6,
        comment: 'Bom',
        movie: movie(1, 'Central do Brasil', 1998),
      });
      await store.saveRating({ movieId: 2, score: 9, movie: movie(2, 'Cidade de Deus', 2002) });
    });

    expect(await screen.findByText('2 filmes avaliados · média 7,5')).toBeDefined();
    expect(titles()).toEqual(['Cidade de Deus', 'Central do Brasil']);

    const central = screen.getByRole('heading', { name: /Central do Brasil/ }).closest('li')!;
    expect(within(central).getByText('(1998)')).toBeDefined();
    expect(within(central).getByText('Bom')).toBeDefined();
    expect(within(central).getByText(/^Avaliado em/)).toBeDefined();
    expect(within(central).getByText('Sua nota:').parentElement?.textContent).toContain('6/10');

    const cidade = screen.getByRole('heading', { name: /Cidade de Deus/ }).closest('li')!;
    expect(within(cidade).getByText('Sem comentário')).toBeDefined();
  });

  it('"Editar" leva direto ao formulário no detalhe do filme', async () => {
    const { store } = renderRatings();
    await act(() =>
      store.saveRating({ movieId: 550, score: 8, movie: movie(550, 'Clube da Luta') }),
    );
    const edit = await screen.findByRole('link', { name: 'Editar avaliação de Clube da Luta' });
    expect(edit.getAttribute('href')).toBe('/filme/550#avaliacao');
  });

  it('ordena pela URL e grava a escolha na URL', async () => {
    const user = userEvent.setup();
    const { store, search } = renderRatings('/avaliacoes?ordem=menor-nota');
    await act(async () => {
      await store.saveRating({ movieId: 1, score: 9, movie: movie(1, 'Alta') });
      await store.saveRating({ movieId: 2, score: 3, movie: movie(2, 'Baixa') });
      await store.saveRating({ movieId: 3, score: 6, movie: movie(3, 'Média') });
    });
    await screen.findByText(/3 filmes avaliados/);
    expect(titles()).toEqual(['Baixa', 'Média', 'Alta']);

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'Maior nota');
    expect(search()).toEqual({ ordem: 'maior-nota' });
    expect(titles()).toEqual(['Alta', 'Média', 'Baixa']);

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'Título (A–Z)');
    expect(titles()).toEqual(['Alta', 'Baixa', 'Média']);
  });

  it('exclui uma avaliação, anuncia e permite desfazer', async () => {
    const user = userEvent.setup();
    const { store } = renderRatings();
    await act(() =>
      store.saveRating({ movieId: 7, score: 7, comment: 'Ok', movie: movie(7, 'Sete') }),
    );

    await user.click(await screen.findByRole('button', { name: 'Excluir avaliação de Sete' }));

    expect(await screen.findByText('Você ainda não avaliou nenhum filme')).toBeDefined();
    expect(screen.getByRole('status').textContent).toBe('Avaliação de Sete excluída.');
    expect(toastSuccess).toHaveBeenCalledWith(
      'Avaliação de "Sete" excluída.',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Desfazer' }) as unknown,
      }),
    );

    const options = toastSuccess.mock.calls[0]?.[1] as { action: { onClick: () => void } };
    act(() => {
      options.action.onClick();
    });
    expect(await screen.findByRole('heading', { name: /Sete/ })).toBeDefined();
    expect(store.getState().ratings.get(7)).toMatchObject({ score: 7, comment: 'Ok' });
  });

  it('se a exclusão falhar (id terminado em 13), mantém a avaliação e avisa', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.ratings,
      JSON.stringify([
        {
          movieId: 413,
          score: 8,
          comment: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          movie: movie(413, 'O Auto da Compadecida', 2000),
        },
      ]),
    );
    renderRatings('/avaliacoes', {
      repository: { storage, shouldFail: (id: number) => String(id).endsWith('13') },
    });

    await user.click(
      await screen.findByRole('button', { name: 'Excluir avaliação de O Auto da Compadecida' }),
    );

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'Não foi possível excluir a avaliação de "O Auto da Compadecida".',
        expect.anything(),
      );
    });
    expect(screen.getByRole('heading', { name: /O Auto da Compadecida/ })).toBeDefined();
  });

  it('avaliação antiga, sem dados do filme, busca o título na TMDB', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.ratings,
      JSON.stringify([
        {
          movieId: 550,
          score: 7,
          comment: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    renderRatings('/avaliacoes', { repository: { storage } });

    // Enquanto a TMDB responde, mostra um título provisório; depois, o real.
    expect(await screen.findByRole('heading', { name: /Filme 550/ })).toBeDefined();
    expect(await screen.findByText('(1999)')).toBeDefined();
  });
});
