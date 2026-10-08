import { cn } from '@nexo/ui';
import { ChartNoAxesColumn, Clapperboard, Film, Heart, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';

import { CounterSkeleton, RemoteWidgetError } from '../remotes/fallbacks';
import { HEADER_REMOTE } from '../remotes/page-remotes';
import { RemoteBoundary } from '../remotes/RemoteBoundary';
import { ThemeToggle } from '../theme/ThemeToggle';

const NAV_ITEMS: readonly { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/filmes', label: 'Filmes', icon: Film },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/avaliacoes', label: 'Avaliações', icon: Star },
  { to: '/painel', label: 'Painel', icon: ChartNoAxesColumn },
];

function topNavLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground',
  );
}

function bottomNavLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'group flex h-full flex-col items-center justify-center gap-1 rounded-lg text-[0.6875rem] font-medium transition-colors',
    isActive ? 'text-highlight' : 'text-muted-foreground hover:text-foreground',
  );
}

/**
 * Navegação principal. Acima de 640 px fica no cabeçalho; até 640 px vira uma
 * barra inferior, ao alcance do polegar. Só uma das duas é exibida por vez,
 * então ambas usam o mesmo nome acessível.
 */
function BottomNav() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <ul className="mx-auto grid h-bottom-nav max-w-md grid-cols-4 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="p-1">
            <NavLink to={to} className={bottomNavLinkClass}>
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors',
                      isActive ? 'bg-primary/15' : 'group-hover:bg-accent',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom))] sm:pb-0">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-header max-w-7xl items-center gap-4 px-gutter">
          <Link
            to="/filmes"
            className="flex items-center gap-2 rounded-md py-1 font-display text-lg font-bold tracking-tight"
          >
            <Clapperboard aria-hidden="true" className="size-6 text-highlight" />
            Nexo Filmes
          </Link>

          <nav aria-label="Principal" className="hidden sm:block">
            <ul className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={topNavLinkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <RemoteBoundary
              id={HEADER_REMOTE}
              areaLabel="o contador de favoritos"
              fallback={<CounterSkeleton />}
              renderError={RemoteWidgetError}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-gutter py-6">
        <Outlet />
      </main>

      <footer className="border-t">
        <p className="mx-auto max-w-7xl px-gutter py-6 text-sm text-muted-foreground">
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

      <BottomNav />
      <ScrollRestoration />
    </div>
  );
}
