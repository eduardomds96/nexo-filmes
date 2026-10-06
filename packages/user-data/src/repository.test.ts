import type { NexoEventMap } from '@nexo/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { failWhenIdEndsWith } from './config';
import { UserDataError } from './errors';
import { subscribe } from './events';
import { STORAGE_KEYS } from './schemas';
import { snapshot, testRepository } from './testing';

afterEach(() => {
  vi.useRealTimers();
});

describe('favoritos', () => {
  it('toggleFavorite favorita e desfavorita (mesma ação)', async () => {
    const { repository } = testRepository();

    await expect(repository.toggleFavorite(snapshot(550))).resolves.toEqual({ favorited: true });
    expect((await repository.listFavorites()).map((f) => f.id)).toEqual([550]);

    await expect(repository.toggleFavorite(snapshot(550))).resolves.toEqual({ favorited: false });
    expect(await repository.listFavorites()).toEqual([]);
  });

  it('guarda o snapshot do filme e a data, do mais recente para o mais antigo', async () => {
    let clock = Date.parse('2026-01-01T00:00:00.000Z');
    const { repository } = testRepository({ now: () => new Date((clock += 1000)) });

    await repository.toggleFavorite(
      snapshot(1, { title: 'Primeiro', posterUrl: 'https://img/1.jpg' }),
    );
    await repository.toggleFavorite(snapshot(2, { title: 'Segundo' }));

    const favorites = await repository.listFavorites();
    expect(favorites.map((f) => f.title)).toEqual(['Segundo', 'Primeiro']);
    expect(favorites[1]).toEqual({
      id: 1,
      title: 'Primeiro',
      year: 2001,
      posterUrl: 'https://img/1.jpg',
      genres: [{ id: 18, name: 'Drama' }],
      favoritedAt: '2026-01-01T00:00:01.000Z',
    });
  });

  it('grava na chave versionada nexo:v1:favorites', async () => {
    const { repository, storage } = testRepository();
    await repository.toggleFavorite(snapshot(7));
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.favorites) ?? '[]')).toHaveLength(1);
    expect(STORAGE_KEYS.favorites).toBe('nexo:v1:favorites');
  });

  it('rejeita snapshot inválido sem gravar', async () => {
    const { repository } = testRepository();
    const invalid = { ...snapshot(1), id: -1 };
    await expect(repository.toggleFavorite(invalid)).rejects.toMatchObject({
      kind: 'invalid-input',
    });
    expect(await repository.listFavorites()).toEqual([]);
  });

  it('emite nexo:favorites:changed com status committed após a escrita', async () => {
    const target = new EventTarget();
    const { repository } = testRepository({ eventTarget: target });
    const events: NexoEventMap['nexo:favorites:changed'][] = [];
    subscribe('nexo:favorites:changed', (detail) => events.push(detail), target);

    await repository.toggleFavorite(snapshot(10));
    await repository.toggleFavorite(snapshot(10));

    expect(events).toEqual([
      { movieId: 10, favorited: true, status: 'committed' },
      { movieId: 10, favorited: false, status: 'committed' },
    ]);
  });
});

describe('avaliações', () => {
  it('salva e lê uma avaliação', async () => {
    const { repository } = testRepository({ now: () => new Date('2026-02-01T10:00:00.000Z') });

    const saved = await repository.saveRating({ movieId: 550, score: 8.5, comment: '  Ótimo  ' });

    expect(saved).toEqual({
      movieId: 550,
      score: 8.5,
      comment: 'Ótimo',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
    });
    await expect(repository.getRating(550)).resolves.toEqual(saved);
    await expect(repository.getRating(1)).resolves.toBeNull();
  });

  it('salvar de novo substitui a anterior e mantém a data de criação', async () => {
    const dates = ['2026-01-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z'];
    const { repository } = testRepository({ now: () => new Date(dates.shift() ?? '') });

    await repository.saveRating({ movieId: 1, score: 6, comment: 'primeira' });
    const second = await repository.saveRating({ movieId: 1, score: 9 });

    expect(await repository.listRatings()).toEqual([second]);
    expect(second).toMatchObject({
      score: 9,
      comment: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });
  });

  it('rejeita avaliação fora das regras', async () => {
    const { repository } = testRepository();
    await expect(repository.saveRating({ movieId: 1, score: 0.3 })).rejects.toMatchObject({
      kind: 'invalid-input',
    });
    await expect(
      repository.saveRating({ movieId: 1, score: 5, comment: 'x'.repeat(501) }),
    ).rejects.toBeInstanceOf(UserDataError);
    expect(await repository.listRatings()).toEqual([]);
  });

  it('exclui uma avaliação e emite o evento com rating null', async () => {
    const target = new EventTarget();
    const { repository } = testRepository({ eventTarget: target });
    const handler = vi.fn();
    subscribe('nexo:rating:changed', handler, target);

    const rating = await repository.saveRating({ movieId: 3, score: 4 });
    await repository.deleteRating(3);

    expect(await repository.getRating(3)).toBeNull();
    expect(handler.mock.calls).toEqual([[{ movieId: 3, rating }], [{ movieId: 3, rating: null }]]);
  });
});

describe('falha simulada em ids terminados em 13', () => {
  const failing = () => testRepository({ shouldFail: failWhenIdEndsWith('13') });

  it('toggleFavorite falha e não grava', async () => {
    const { repository } = failing();
    await expect(repository.toggleFavorite(snapshot(413))).rejects.toMatchObject({
      kind: 'simulated-failure',
    });
    expect(await repository.listFavorites()).toEqual([]);
  });

  it('saveRating e deleteRating falham', async () => {
    const { repository } = failing();
    await expect(repository.saveRating({ movieId: 13, score: 5 })).rejects.toMatchObject({
      kind: 'simulated-failure',
    });
    await expect(repository.deleteRating(13)).rejects.toMatchObject({ kind: 'simulated-failure' });
  });

  it('leituras e outros ids funcionam', async () => {
    const { repository } = failing();
    await expect(repository.toggleFavorite(snapshot(131))).resolves.toEqual({ favorited: true });
    await expect(repository.getRating(13)).resolves.toBeNull();
  });
});

describe('atraso configurável', () => {
  it('espera o atraso informado em cada operação', async () => {
    vi.useFakeTimers();
    const { repository } = testRepository({ delay: 800 });

    let done = false;
    const promise = repository.listFavorites().then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(799);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(done).toBe(true);
  });

  it('aceita uma função de atraso, sorteada a cada operação', async () => {
    vi.useFakeTimers();
    const delay = vi.fn(() => 100);
    const { repository } = testRepository({ delay });

    const pending = Promise.all([repository.listFavorites(), repository.listRatings()]);
    await vi.advanceTimersByTimeAsync(100);
    await pending;
    expect(delay).toHaveBeenCalledTimes(2);
  });
});

describe('dados corrompidos', () => {
  it.each([
    ['JSON inválido', '{nao é json'],
    ['objeto em vez de lista', '{"id":1}'],
    ['nulo', 'null'],
  ])('%s vira lista vazia', async (_, raw) => {
    const { repository, storage } = testRepository();
    storage.setItem(STORAGE_KEYS.favorites, raw);
    storage.setItem(STORAGE_KEYS.ratings, raw);
    await expect(repository.listFavorites()).resolves.toEqual([]);
    await expect(repository.listRatings()).resolves.toEqual([]);
  });

  it('descarta só os itens inválidos e se recupera na próxima escrita', async () => {
    const { repository, storage } = testRepository();
    const valid = { ...snapshot(1), favoritedAt: '2026-01-01T00:00:00.000Z' };
    storage.setItem(
      STORAGE_KEYS.favorites,
      JSON.stringify([valid, { id: 'x' }, null, { ...valid, id: 2, favoritedAt: 'ontem' }]),
    );

    expect((await repository.listFavorites()).map((f) => f.id)).toEqual([1]);

    await repository.toggleFavorite(snapshot(3));
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.favorites) ?? '[]')).toHaveLength(2);
  });

  it('descarta avaliação com nota fora das regras', async () => {
    const { repository, storage } = testRepository();
    const base = {
      comment: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    storage.setItem(
      STORAGE_KEYS.ratings,
      JSON.stringify([
        { ...base, movieId: 1, score: 7 },
        { ...base, movieId: 2, score: 7.3 },
      ]),
    );
    expect((await repository.listRatings()).map((r) => r.movieId)).toEqual([1]);
  });

  it('erro ao ler o armazenamento não derruba a leitura', async () => {
    const { repository } = testRepository({
      storage: {
        getItem: () => {
          throw new Error('SecurityError');
        },
        setItem: () => undefined,
      },
    });
    await expect(repository.listFavorites()).resolves.toEqual([]);
  });

  it('erro ao gravar (cota cheia) vira UserDataError de storage', async () => {
    const { repository } = testRepository({
      storage: {
        getItem: () => null,
        setItem: () => {
          throw new DOMException('cheio', 'QuotaExceededError');
        },
      },
    });
    await expect(repository.toggleFavorite(snapshot(1))).rejects.toMatchObject({ kind: 'storage' });
  });
});
