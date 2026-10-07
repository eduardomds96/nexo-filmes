import { cn } from '@nexo/ui';
import { Clapperboard } from 'lucide-react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';

import { CounterSkeleton, RemoteWidgetError } from '../remotes/fallbacks';
import { RemoteBoundary } from '../remotes/RemoteBoundary';
import { ThemeToggle } from '../theme/ThemeToggle';

const NAV_ITEMS = [
  { to: '/filmes', label: 'Filmes' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/avaliacoes', label: 'Avaliações' },
  { to: '/painel', label: 'Painel' },
] as const;

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground',
  );
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <Link
            to="/filmes"
            className="flex items-center gap-2 rounded-md py-1 text-lg font-bold tracking-tight"
          >
            <Clapperboard aria-hidden="true" className="size-6 text-primary" />
            Nexo Filmes
          </Link>

          <nav aria-label="Principal" className="order-last w-full sm:order-none sm:w-auto">
            <ul className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <RemoteBoundary
              id="minha_area/FavoritesCounter"
              areaLabel="o contador de favoritos"
              fallback={<CounterSkeleton />}
              renderError={RemoteWidgetError}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground">
          Dados e imagens de filmes fornecidos pela{' '}
          <a
            href="https://www.themoviedb.org/"
            className="underline underline-offset-4 hover:text-foreground"
            rel="noreferrer"
            target="_blank"
          >
            TMDB
          </a>
          . Este produto usa a API da TMDB, mas não é endossado nem certificado por ela.
        </p>
      </footer>

      <ScrollRestoration />
    </div>
  );
}
