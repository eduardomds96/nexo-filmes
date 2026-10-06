import type { MovieSnapshot } from '@nexo/contracts';
import { renderRoute } from '@nexo/testing';
import {
  createLocalUserDataRepository,
  createMemoryStorage,
  createUserDataStore,
} from '@nexo/user-data';
import { act, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DashboardScreen } from './DashboardScreen';
import { FavoritesCounter } from './FavoritesCounter';
import { FavoritesScreen } from './FavoritesScreen';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));

function snapshot(id: number, title: string, genres: string[] = ['Drama']): MovieSnapshot {
  return {
    id,
    title,
    year: 2001,
    posterUrl: null,
    genres: genres.map((name, index) => ({ id: index + 1, name })),
  };
}

function renderWithCounter(page: ReactElement, options = {}) {
  return renderRoute(
    <>
      <FavoritesCounter />
      {page}
    </>,
    { path: '/', initialEntry: '/', ...options },
  );
}

describe('FavoritesCounter', () => {
  it('mostra a contagem e linka para /favoritos', async () => {
    const { store } = renderRoute(<FavoritesCounter />, { path: '/', initialEntry: '/' });
    const link = await screen.findByRole('link', { name: 'Favoritos: 0 filmes' });
    expect(link.getAttribute('href')).toBe('/favoritos');

    await act(() => store.toggleFavorite(snapshot(1, 'A')));
    expect(screen.getByRole('link', { name: 'Favoritos: 1 filme' })).toBeDefined();
  });

  it('muda na hora (otimista) e volta se o salvamento falhar', async () => {
    const { store } = renderRoute(<FavoritesCounter />, {
      path: '/',
      initialEntry: '/',
      repository: { shouldFail: () => true, delay: 50 },
    });
    await screen.findByRole('link', { name: 'Favoritos: 0 filmes' });

    let toggling: Promise<unknown> = Promise.resolve();
    act(() => {
      toggling = store.toggleFavorite(snapshot(13, 'Treze'));
    });
    expect(screen.getByRole('link', { name: 'Favoritos: 1 filme' })).toBeDefined();

    await act(() => toggling);
    expect(screen.getByRole('link', { name: 'Favoritos: 0 filmes' })).toBeDefined();
  });
});

describe('FavoritesScreen', () => {
  it('lista pôster, título, ano e a nota do usuário', async () => {
    const { store } = renderWithCounter(<FavoritesScreen />);
    await act(async () => {
      await store.toggleFavorite(snapshot(1, 'Cidade de Deus'));
      await store.toggleFavorite(snapshot(2, 'Central do Brasil'));
      await store.saveRating({ movieId: 2, score: 9.5 });
    });

    expect(await screen.findByText('2 filmes na sua lista.')).toBeDefined();
    const cards = screen.getAllByRole('heading', { level: 3 }).map((h) => h.closest('li')!);
    const central = cards.find((c) =>
      within(c).queryByRole('heading', { name: 'Central do Brasil' }),
    )!;
    expect(within(central).getByText('Sua nota: 9,5')).toBeDefined();
    expect(within(central).getByText('2001')).toBeDefined();
    expect(
      within(central).getByRole('img', { name: 'Pôster indisponível: Central do Brasil' }),
    ).toBeDefined();
    const cidade = cards.find((c) => within(c).queryByRole('heading', { name: 'Cidade de Deus' }))!;
    expect(within(cidade).getByText('Sem sua avaliação')).toBeDefined();
  });

  it('remove um favorito e atualiza o contador sem recarregar', async () => {
    const user = userEvent.setup();
    const { store } = renderWithCounter(<FavoritesScreen />);
    await act(() => store.toggleFavorite(snapshot(1, 'Cidade de Deus')));
    await screen.findByText('1 filme na sua lista.');
    expect(screen.getByRole('link', { name: 'Favoritos: 1 filme' })).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Remover Cidade de Deus dos favoritos' }));

    expect(await screen.findByText('Você ainda não tem favoritos')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Favoritos: 0 filmes' })).toBeDefined();
    expect(screen.getByRole('status').textContent).toBe('Cidade de Deus removido dos favoritos.');
    await waitFor(() => {
      expect(store.getState().pending.size).toBe(0);
    });
  });

  it('se a remoção falhar, o filme volta para a lista e o usuário é avisado', async () => {
    const user = userEvent.setup();
    // Um favorito de id terminado em 13 já salvo antes (gravado sem a regra de falha).
    const storage = createMemoryStorage();
    await createLocalUserDataRepository({
      storage,
      delay: 0,
      shouldFail: () => false,
      eventTarget: null,
    }).toggleFavorite(snapshot(113, 'Cento e treze'));

    const { store } = renderWithCounter(<FavoritesScreen />, {
      repository: { storage, shouldFail: (id: number) => String(id).endsWith('13') },
    });
    await screen.findByText('1 filme na sua lista.');

    await user.click(screen.getByRole('button', { name: 'Remover Cento e treze dos favoritos' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'Não foi possível remover "Cento e treze" dos favoritos.',
        expect.anything(),
      );
    });
    expect(screen.getByRole('heading', { name: 'Cento e treze' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Favoritos: 1 filme' })).toBeDefined();
    expect(store.getState().favoriteIds.has(113)).toBe(true);
  });

  it('mostra estado vazio com link para o catálogo', async () => {
    renderWithCounter(<FavoritesScreen />);
    expect(await screen.findByText('Você ainda não tem favoritos')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Explorar filmes' }).getAttribute('href')).toBe(
      '/filmes',
    );
  });

  it('mostra erro com "Tentar novamente" quando a leitura falha', async () => {
    const user = userEvent.setup();
    const repository = createLocalUserDataRepository({
      storage: createMemoryStorage(),
      delay: 0,
      shouldFail: () => false,
      eventTarget: null,
    });
    vi.spyOn(repository, 'listFavorites').mockRejectedValueOnce(new Error('fora do ar'));
    const store = createUserDataStore({ repository, eventTarget: null, storageEventTarget: null });
    renderRoute(<FavoritesScreen />, { path: '/', initialEntry: '/', store });

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Não foi possível carregar seus favoritos')).toBeDefined();

    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Você ainda não tem favoritos')).toBeDefined();
  });
});

describe('DashboardScreen', () => {
  it('mostra totais, média com 1 casa e gênero mais frequente', async () => {
    const { store } = renderRoute(<DashboardScreen />, { path: '/', initialEntry: '/' });
    await act(async () => {
      await store.toggleFavorite(snapshot(1, 'A', ['Drama', 'Crime']));
      await store.toggleFavorite(snapshot(2, 'B', ['Ação']));
      await store.toggleFavorite(snapshot(3, 'C', ['Crime']));
      await store.saveRating({ movieId: 1, score: 7 });
      await store.saveRating({ movieId: 9, score: 8 });
    });

    const list = (await screen.findByText('Filmes avaliados')).closest('dl')!;
    expect(within(list).getByText('3')).toBeDefined();
    expect(within(list).getByText('2')).toBeDefined();
    expect(within(list).getByText('7,5')).toBeDefined();
    expect(within(list).getByText('Crime')).toBeDefined();
    expect(within(list).getByText('2 favoritos')).toBeDefined();
  });

  it('mostra estado vazio sem favoritos nem avaliações', async () => {
    renderRoute(<DashboardScreen />, { path: '/', initialEntry: '/' });
    expect(await screen.findByText('Seu painel está vazio')).toBeDefined();
  });

  it('com favoritos e sem avaliações mostra média como travessão', async () => {
    const { store } = renderRoute(<DashboardScreen />, { path: '/', initialEntry: '/' });
    await act(() => store.toggleFavorite(snapshot(1, 'A', ['Drama'])));
    expect(await screen.findByText('Nenhuma avaliação ainda')).toBeDefined();
    expect(screen.getByText('—')).toBeDefined();
  });
});
