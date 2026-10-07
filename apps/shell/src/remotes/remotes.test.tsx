import type { RemoteModuleId } from '@nexo/contracts';
import { renderRoute } from '@nexo/testing';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { userEvent } from '@testing-library/user-event';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '../app/router';
import { RemotePageError } from './fallbacks';
import { RemoteBoundary } from './RemoteBoundary';
import { loadRemoteModule, registerKnownRemotes, resetRemoteCache } from './remote-loader';

const runtime = vi.hoisted(() => ({
  loadRemote: vi.fn<(id: string) => Promise<unknown>>(),
  registerRemotes: vi.fn(),
}));
vi.mock('@module-federation/runtime', () => runtime);

/** Remotes "no ar": cada id devolve um componente simples. */
const available: Partial<Record<RemoteModuleId, () => unknown>> = {};
const down = new Set<string>();

function remoteComponent(text: string) {
  return { default: () => <p>{text}</p> };
}

beforeEach(() => {
  resetRemoteCache();
  down.clear();
  Object.assign(available, {
    'catalogo/CatalogPage': () => remoteComponent('Página do catálogo'),
    'filme/MoviePage': () => remoteComponent('Página do filme'),
    'minha_area/FavoritesPage': () => remoteComponent('Página de favoritos'),
    'minha_area/DashboardPage': () => remoteComponent('Página do painel'),
    'minha_area/FavoritesCounter': () => ({
      default: () => <Link to="/favoritos">Contador: 3</Link>,
    }),
  });
  runtime.loadRemote.mockImplementation((id) => {
    const remote = id.slice(0, id.indexOf('/'));
    if (down.has(remote)) return Promise.reject(new Error(`remote ${remote} fora do ar`));
    const factory = available[id as RemoteModuleId];
    return factory ? Promise.resolve(factory()) : Promise.reject(new Error('módulo inexistente'));
  });
});

/**
 * No React 19, um componente que suspende com use() dentro de um act()
 * síncrono só retoma quando o act é aguardado. Por isso renderização e
 * cliques que disparam uma nova carga de remote passam por act assíncrono.
 */
async function renderAsync(ui: ReactElement) {
  await act(async () => {
    renderRoute(ui, { path: '/', initialEntry: '/' });
    await Promise.resolve();
  });
}

async function clickAsync(element: HTMLElement) {
  await act(async () => {
    element.click();
    await Promise.resolve();
  });
}

async function renderShell(initialEntry: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await Promise.resolve();
  });
  return router;
}

describe('carregamento de remotes', () => {
  it('registra os três remotes no runtime', () => {
    registerKnownRemotes();
    const names = runtime.registerRemotes.mock.calls.map(
      ([remotes]) => (remotes as { name: string }[])[0]?.name,
    );
    expect(names).toEqual(['catalogo', 'filme', 'minha_area']);
  });

  it('rejeita módulo sem componente default', async () => {
    available['filme/MoviePage'] = () => ({ default: 'não é componente' });
    await expect(loadRemoteModule('filme/MoviePage')).rejects.toMatchObject({
      name: 'RemoteLoadError',
      remote: 'filme',
    });
  });

  it('depois de uma falha, registra o remote de novo com URL nova antes de tentar', async () => {
    down.add('filme');
    await expect(loadRemoteModule('filme/MoviePage')).rejects.toThrow();
    down.delete('filme');
    runtime.registerRemotes.mockClear();

    await expect(loadRemoteModule('filme/MoviePage')).resolves.toBeDefined();
    expect(runtime.registerRemotes).toHaveBeenCalledWith(
      [
        {
          name: 'filme',
          entry: 'http://localhost:3002/remoteEntry.js?tentativa=1',
          type: 'module',
          shareScope: 'default',
        },
      ],
      { force: true },
    );
  });
});

describe('isolamento de falhas', () => {
  it('remote fora do ar mostra erro só na sua área; o resto do portal funciona', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    down.add('catalogo');
    await renderAsync(
      <>
        <RemoteBoundary
          id="minha_area/FavoritesCounter"
          areaLabel="o contador"
          fallback={<p>carregando contador</p>}
          renderError={RemotePageError}
        />
        <RemoteBoundary
          id="catalogo/CatalogPage"
          areaLabel="o catálogo"
          fallback={<p>carregando catálogo</p>}
          renderError={RemotePageError}
        />
      </>,
    );

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Não foi possível carregar o catálogo')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Contador: 3' })).toBeDefined();
  });

  it('"Tentar novamente" recarrega o remote de verdade', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    down.add('catalogo');
    await renderAsync(
      <RemoteBoundary
        id="catalogo/CatalogPage"
        areaLabel="o catálogo"
        fallback={<p>carregando</p>}
        renderError={RemotePageError}
      />,
    );
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' });
    const callsBefore = runtime.loadRemote.mock.calls.length;

    down.delete('catalogo');
    await clickAsync(retry);

    expect(await screen.findByText('Página do catálogo')).toBeDefined();
    expect(runtime.loadRemote.mock.calls.length).toBe(callsBefore + 1);
    expect(runtime.registerRemotes).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: 'catalogo',
          entry: expect.stringContaining('tentativa=1') as unknown,
        }),
      ],
      { force: true },
    );
  });

  it('erro ao renderizar o remote também fica restrito à área dele', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let broken = true;
    available['filme/MoviePage'] = () => ({
      default: () => {
        if (broken) throw new Error('bug no remote');
        return <p>Filme consertado</p>;
      },
    });
    await renderAsync(
      <>
        <p>Cabeçalho do Shell</p>
        <RemoteBoundary
          id="filme/MoviePage"
          areaLabel="o detalhe do filme"
          fallback={<p>carregando</p>}
          renderError={RemotePageError}
        />
      </>,
    );

    expect(await screen.findByText('Não foi possível carregar o detalhe do filme')).toBeDefined();
    expect(screen.getByText('Cabeçalho do Shell')).toBeDefined();

    broken = false;
    await clickAsync(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Filme consertado')).toBeDefined();
  });
});

describe('layout do Shell', () => {
  it('tem link para pular ao conteúdo, navegação e contador do remote', async () => {
    await renderShell('/filmes');
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' }).getAttribute('href')).toBe(
      '#conteudo',
    );
    // Cabeçalho (acima de 640 px) e barra inferior (até 640 px): o CSS mostra só uma.
    const navs = screen.getAllByRole('navigation', { name: 'Principal' });
    expect(navs).toHaveLength(2);
    const [top, bottom] = navs;
    expect(top?.closest('header')).not.toBeNull();
    expect(bottom?.closest('header')).toBeNull();
    for (const nav of navs) {
      expect(
        within(nav)
          .getAllByRole('link')
          .map((a) => a.textContent),
      ).toEqual(['Filmes', 'Favoritos', 'Avaliações', 'Painel']);
      expect(within(nav).getByRole('link', { name: 'Filmes' }).getAttribute('aria-current')).toBe(
        'page',
      );
    }
    expect(await screen.findByRole('link', { name: 'Contador: 3' })).toBeDefined();
  });

  it('se o contador cair, só o widget mostra erro e a navegação continua', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    down.add('minha_area');
    await renderShell('/filmes');

    const retry = await screen.findByRole('button', { name: 'Tentar novamente' });
    expect(retry.closest('header')).not.toBeNull();

    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Filmes' }));
    await waitFor(() => {
      expect(screen.getByText('Página do catálogo')).toBeDefined();
    });

    down.delete('minha_area');
    await clickAsync(retry);
    expect(await screen.findByRole('link', { name: 'Contador: 3' })).toBeDefined();
  });
});

describe('rotas', () => {
  it('declara as rotas de topo e a 404', () => {
    const children = routes[0]?.children ?? [];
    expect(children.map((route) => route.path ?? 'index')).toEqual([
      'index',
      'filmes',
      'filme/:id',
      'favoritos',
      'avaliacoes',
      'painel',
      '*',
    ]);
  });
});
