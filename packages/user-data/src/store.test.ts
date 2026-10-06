import type { NexoEventMap } from '@nexo/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { failWhenIdEndsWith } from './config';
import { emit, subscribe } from './events';
import { createLocalUserDataRepository } from './repository';
import type { LocalRepositoryOptions } from './repository';
import { STORAGE_KEYS } from './schemas';
import { createMemoryStorage } from './storage';
import type { KeyValueStorage } from './storage';
import { createUserDataStore } from './store';
import type { UserDataStore } from './store';
import { snapshot } from './testing';

const stores: UserDataStore[] = [];

afterEach(() => {
  for (const store of stores.splice(0)) store.dispose();
  vi.useRealTimers();
});

interface Setup {
  storage?: KeyValueStorage;
  target?: EventTarget;
  repo?: Partial<LocalRepositoryOptions>;
}

function setup({
  storage = createMemoryStorage(),
  target = new EventTarget(),
  repo = {},
}: Setup = {}) {
  const repository = createLocalUserDataRepository({
    storage,
    delay: 0,
    shouldFail: () => false,
    eventTarget: target,
    ...repo,
  });
  const store = createUserDataStore({
    repository,
    eventTarget: target,
    storageEventTarget: target,
  });
  stores.push(store);
  return { store, storage, target, repository };
}

function recordFavoriteEvents(target: EventTarget) {
  const events: NexoEventMap['nexo:favorites:changed'][] = [];
  subscribe('nexo:favorites:changed', (detail) => events.push(detail), target);
  return events;
}

describe('carregamento', () => {
  it('começa ocioso e carrega favoritos e avaliações do repositório', async () => {
    const storage = createMemoryStorage();
    const seed = setup({ storage });
    await seed.repository.toggleFavorite(snapshot(1));
    await seed.repository.saveRating({ movieId: 1, score: 7 });

    const { store } = setup({ storage });
    expect(store.getState().status).toBe('idle');

    const loading = store.load();
    expect(store.getState().status).toBe('loading');
    await loading;

    const state = store.getState();
    expect(state.status).toBe('ready');
    expect([...state.favoriteIds]).toEqual([1]);
    expect(state.ratings.get(1)?.score).toBe(7);
  });

  it('o primeiro subscribe dispara o carregamento uma única vez', async () => {
    const { store, repository } = setup();
    const spy = vi.spyOn(repository, 'listFavorites');
    store.subscribe(() => undefined);
    store.subscribe(() => undefined);
    await store.load();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('falha de leitura deixa o status em erro e permite tentar de novo', async () => {
    const { store, repository } = setup();
    vi.spyOn(repository, 'listFavorites').mockRejectedValueOnce(new Error('fora do ar'));
    await store.load();
    expect(store.getState().status).toBe('error');
    await store.load();
    expect(store.getState().status).toBe('ready');
  });
});

describe('favorito otimista', () => {
  it('muda na hora, marca pendente e confirma ao salvar', async () => {
    vi.useFakeTimers();
    const { store, target } = setup({ repo: { delay: 500 } });
    const events = recordFavoriteEvents(target);

    const toggling = store.toggleFavorite(snapshot(550));

    // Antes de o repositório responder: já favoritado e pendente.
    expect(store.getState().favoriteIds.has(550)).toBe(true);
    expect(store.getState().pending.has(550)).toBe(true);
    expect(store.getState().favorites.map((f) => f.id)).toEqual([550]);
    expect(events).toEqual([{ movieId: 550, favorited: true, status: 'pending' }]);

    await vi.advanceTimersByTimeAsync(500);
    await expect(toggling).resolves.toEqual({ status: 'committed', favorited: true });

    expect(store.getState().pending.has(550)).toBe(false);
    expect(store.getState().favoriteIds.has(550)).toBe(true);
    expect(events.at(-1)).toEqual({ movieId: 550, favorited: true, status: 'committed' });
  });

  it('reverte ao estado anterior quando o salvamento falha', async () => {
    const { store, target } = setup({ repo: { shouldFail: failWhenIdEndsWith('13') } });
    const events = recordFavoriteEvents(target);

    const result = await store.toggleFavorite(snapshot(413));

    expect(result).toMatchObject({ status: 'reverted', favorited: false });
    expect(result.status === 'reverted' && result.error).toMatchObject({
      kind: 'simulated-failure',
    });
    expect(store.getState().favoriteIds.has(413)).toBe(false);
    expect(store.getState().favorites).toEqual([]);
    expect(store.getState().pending.size).toBe(0);
    expect(events).toEqual([
      { movieId: 413, favorited: true, status: 'pending' },
      { movieId: 413, favorited: false, status: 'reverted' },
    ]);
  });

  it('reverte uma remoção que falha, devolvendo o filme à lista', async () => {
    const storage = createMemoryStorage();
    await setup({ storage }).repository.toggleFavorite(snapshot(113));
    const { store } = setup({ storage, repo: { shouldFail: failWhenIdEndsWith('13') } });
    await store.load();

    const result = await store.toggleFavorite(snapshot(113));

    expect(result.status).toBe('reverted');
    expect(store.getState().favoriteIds.has(113)).toBe(true);
    expect(store.getState().favorites.map((f) => f.id)).toEqual([113]);
  });

  it('ignora um segundo toggle do mesmo filme enquanto o primeiro está pendente', async () => {
    vi.useFakeTimers();
    const { store, repository } = setup({ repo: { delay: 300 } });
    const spy = vi.spyOn(repository, 'toggleFavorite');

    const first = store.toggleFavorite(snapshot(1));
    await expect(store.toggleFavorite(snapshot(1))).resolves.toEqual({ status: 'ignored' });

    await vi.advanceTimersByTimeAsync(300);
    await first;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(store.getState().favoriteIds.has(1)).toBe(true);
  });

  it('notifica os assinantes a cada mudança', async () => {
    const { store } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    await store.load();
    listener.mockClear();

    await store.toggleFavorite(snapshot(1));
    expect(listener).toHaveBeenCalled();
  });
});

describe('coerência entre cópias da store (remotes sem singleton)', () => {
  it('outra store na mesma página reflete pendente e confirmação sem recarregar', async () => {
    vi.useFakeTimers();
    const storage = createMemoryStorage();
    const target = new EventTarget();
    const a = setup({ storage, target, repo: { delay: 200 } });
    const b = setup({ storage, target, repo: { delay: 200 } });
    const loads = Promise.all([a.store.load(), b.store.load()]);
    await vi.advanceTimersByTimeAsync(200);
    await loads;

    const toggling = a.store.toggleFavorite(snapshot(42));
    expect(b.store.getState().favoriteIds.has(42)).toBe(true);
    expect(b.store.getState().pending.has(42)).toBe(true);

    await vi.advanceTimersByTimeAsync(200);
    await toggling;
    expect(b.store.getState().pending.has(42)).toBe(false);
    expect(b.store.getState().favorites.map((f) => f.id)).toEqual([42]);
  });

  it('outra store também volta atrás quando o salvamento falha', async () => {
    const storage = createMemoryStorage();
    const target = new EventTarget();
    const a = setup({ storage, target, repo: { shouldFail: () => true } });
    const b = setup({ storage, target });
    await Promise.all([a.store.load(), b.store.load()]);

    await a.store.toggleFavorite(snapshot(9));

    expect(b.store.getState().favoriteIds.has(9)).toBe(false);
    expect(b.store.getState().pending.size).toBe(0);
  });

  it('aplica mudanças de avaliação vindas de eventos', async () => {
    const { store, target } = setup();
    await store.load();
    const rating = {
      movieId: 5,
      score: 9,
      comment: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    emit('nexo:rating:changed', { movieId: 5, rating }, target);
    expect(store.getState().ratings.get(5)).toEqual(rating);

    emit('nexo:rating:changed', { movieId: 5, rating: null }, target);
    expect(store.getState().ratings.has(5)).toBe(false);
  });
});

describe('sincronização entre abas (evento storage)', () => {
  it('relê o armazenamento quando outra aba grava', async () => {
    const storage = createMemoryStorage();
    const { store, target } = setup({ storage });
    await store.load();

    // Outra aba grava direto no armazenamento compartilhado.
    await setup({ storage, target: new EventTarget() }).repository.toggleFavorite(snapshot(77));
    expect(store.getState().favoriteIds.has(77)).toBe(false);

    const event = new Event('storage') as Event & { key: string };
    Object.defineProperty(event, 'key', { value: STORAGE_KEYS.favorites });
    target.dispatchEvent(event);

    expect(store.getState().favoriteIds.has(77)).toBe(true);
  });

  it('ignora chaves que não são do Nexo', async () => {
    const { store, target, repository } = setup();
    await store.load();
    const spy = vi.spyOn(repository, 'readFavoritesNow');
    const event = new Event('storage');
    Object.defineProperty(event, 'key', { value: 'outra-chave' });
    target.dispatchEvent(event);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('avaliações', () => {
  it('saveRating atualiza o estado; deleteRating remove', async () => {
    const { store } = setup();
    await store.load();

    await store.saveRating({ movieId: 3, score: 6.5, comment: 'bom' });
    expect(store.getState().ratings.get(3)).toMatchObject({ score: 6.5, comment: 'bom' });

    await store.deleteRating(3);
    expect(store.getState().ratings.has(3)).toBe(false);
  });

  it('saveRating propaga a falha sem alterar o estado', async () => {
    const { store } = setup({ repo: { shouldFail: () => true } });
    await store.load();
    await expect(store.saveRating({ movieId: 13, score: 5 })).rejects.toMatchObject({
      kind: 'simulated-failure',
    });
    expect(store.getState().ratings.size).toBe(0);
  });
});
