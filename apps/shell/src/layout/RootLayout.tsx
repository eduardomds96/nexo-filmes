import { Link, NavLink, Outlet } from 'react-router';

import { RemoteBoundary } from '../remotes/RemoteBoundary';
import { RemoteErrorPanel } from '../remotes/RemoteErrorPanel';

export function RootLayout() {
  return (
    <>
      <a href="#conteudo">Pular para o conteúdo</a>
      <header>
        <Link to="/filmes">Nexo Filmes</Link>
        <nav aria-label="Principal">
          <NavLink to="/filmes">Filmes</NavLink> <NavLink to="/favoritos">Favoritos</NavLink>{' '}
          <NavLink to="/painel">Painel</NavLink>
        </nav>
        <RemoteBoundary
          id="minha_area/FavoritesCounter"
          renderError={RemoteErrorPanel}
          areaLabel="o contador de favoritos"
          fallback={<span>…</span>}
        />
      </header>
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
