import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFavorite, useFavoritesCount, useRating, UserDataProvider } from './react';
import { createLocalUserDataRepository } from './repository';
import { createMemoryStorage } from './storage';
import { createUserDataStore } from './store';
import type { UserDataStore } from './store';
import { snapshot } from './testing';

let store: UserDataStore;

afterEach(() => {
  cleanup();
  store.dispose();
});

function makeStore(shouldFail: (id: number) => boolean = () => false) {
  store = createUserDataStore({
    repository: createLocalUserDataRepository({
      storage: createMemoryStorage(),
      delay: 0,
      shouldFail,
      eventTarget: null,
    }),
    eventTarget: null,
    storageEventTarget: null,
  });
  return store;
}

const movie = snapshot(550);

function FavoriteToggle({ onReverted }: { onReverted?: () => void }) {
  const { isFavorite, isPending, toggle } = useFavorite(movie, onReverted ? { onReverted } : {});
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-busy={isPending}
      onClick={() => void toggle()}
    >
      favorito
    </button>
  );
}

function Counter() {
  return <output aria-label="contador">{useFavoritesCount()}</output>;
}

function RatingView() {
  const rating = useRating(550);
  return <p>{rating ? `nota ${String(rating.score)}` : 'sem nota'}</p>;
}

describe('hooks', () => {
  it('o mesmo favorito aparece igual em componentes diferentes sem recarregar', async () => {
    render(
      <UserDataProvider store={makeStore()}>
        <FavoriteToggle />
        <Counter />
      </UserDataProvider>,
    );
    const button = screen.getByRole('button', { name: 'favorito' });
    expect(button).toHaveProperty('ariaPressed', 'false');

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('contador').textContent).toBe('1');
  });

  it('chama onReverted quando o salvamento falha', async () => {
    const onReverted = vi.fn();
    render(
      <UserDataProvider store={makeStore(() => true)}>
        <FavoriteToggle onReverted={onReverted} />
      </UserDataProvider>,
    );

    await act(async () => {
      screen.getByRole('button').click();
      await Promise.resolve();
    });

    expect(onReverted).toHaveBeenCalledWith(expect.objectContaining({ status: 'reverted' }));
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
  });

  it('useRating reflete a avaliação salva', async () => {
    render(
      <UserDataProvider store={makeStore()}>
        <RatingView />
      </UserDataProvider>,
    );
    expect(screen.getByText('sem nota')).toBeDefined();
    await act(() => store.saveRating({ movieId: 550, score: 8 }));
    expect(screen.getByText('nota 8')).toBeDefined();
  });
});
