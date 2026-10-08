import { beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  loadRemote: vi.fn((id: string) => Promise.resolve({ default: () => id })),
  registerRemotes: vi.fn(),
}));
vi.mock('@module-federation/runtime', () => runtime);

const { HEADER_REMOTE, PAGE_REMOTES, preloadRemotesFor, remoteForPath } =
  await import('./page-remotes');
const { getRemoteModule, resetRemoteCache } = await import('./remote-loader');

beforeEach(() => {
  resetRemoteCache();
});

describe('remoteForPath', () => {
  it.each([
    ['/', 'catalogo/CatalogPage'],
    ['/filmes', 'catalogo/CatalogPage'],
    ['/filme/550', 'filme/MoviePage'],
    ['/favoritos', 'minha_area/FavoritesPage'],
    ['/avaliacoes', 'minha_area/RatingsPage'],
    ['/painel', 'minha_area/DashboardPage'],
  ])('%s usa %s', (path, id) => {
    expect(remoteForPath(path)).toBe(id);
  });

  it('rotas sem remote não carregam nada', () => {
    expect(remoteForPath('/nao-existe')).toBeNull();
  });

  it('cobre todas as páginas da tabela', () => {
    expect(PAGE_REMOTES.map((page) => page.path)).toEqual([
      'filmes',
      'filme/:id',
      'favoritos',
      'avaliacoes',
      'painel',
    ]);
  });
});

describe('preloadRemotesFor', () => {
  it('começa a carregar o remote da página e o do cabeçalho, uma vez cada', async () => {
    preloadRemotesFor('/filme/7');
    expect(runtime.loadRemote.mock.calls.map(([id]) => id)).toEqual([
      HEADER_REMOTE,
      'filme/MoviePage',
    ]);

    // O RemoteBoundary reaproveita a mesma carga.
    await getRemoteModule('filme/MoviePage');
    expect(runtime.loadRemote).toHaveBeenCalledTimes(2);
  });

  it('em rota sem remote, carrega só o cabeçalho', () => {
    preloadRemotesFor('/nao-existe');
    expect(runtime.loadRemote.mock.calls.map(([id]) => id)).toEqual([HEADER_REMOTE]);
  });
});
