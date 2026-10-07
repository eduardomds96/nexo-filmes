import {
  Button,
  Card,
  EmptyChartArt,
  EmptyState,
  ErrorState,
  PageHeading,
  Skeleton,
  formatCount,
} from '@nexo/ui';
import { useFavorites, useRatings, useUserDataStatus, useUserDataStore } from '@nexo/user-data';
import { ChartNoAxesColumn, Heart, Star, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { computeDashboard, formatAverage, genreChartData } from '../domain/dashboard';
import { GenreChart } from './GenreChart';

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card className="relative min-w-0 gap-3 overflow-hidden p-4 sm:p-5">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-primary/10 blur-2xl"
      />
      <dt className="flex items-start gap-2.5 text-sm font-medium text-muted-foreground sm:items-center">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-highlight">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        {label}
      </dt>
      <dd className="truncate font-display text-2xl font-bold tracking-tight tabular-nums sm:text-4xl">
        {value}
      </dd>
      {hint && <dd className="text-sm text-muted-foreground">{hint}</dd>}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        Carregando painel…
      </span>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function DashboardScreen() {
  const store = useUserDataStore();
  const status = useUserDataStatus();
  const favorites = useFavorites();
  const ratings = useRatings();
  const stats = computeDashboard(favorites, [...ratings.values()]);

  let content;
  if (status === 'idle' || status === 'loading') {
    content = <DashboardSkeleton />;
  } else if (status === 'error') {
    content = (
      <ErrorState
        title="Não foi possível carregar o painel"
        message="Tente novamente em instantes."
        onRetry={() => void store.load()}
      />
    );
  } else if (stats.totalFavorites === 0 && stats.totalRated === 0) {
    content = (
      <EmptyState
        illustration={<EmptyChartArt />}
        title="Seu painel está vazio"
        description="Favorite e avalie filmes: aqui aparecem sua nota média, seus gêneros preferidos e muito mais."
        action={
          <Button asChild size="lg">
            <Link to="/filmes">Explorar filmes</Link>
          </Button>
        }
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-6">
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={Heart}
            label="Favoritos"
            value={formatCount(stats.totalFavorites)}
            hint={
              stats.totalFavorites > 0 ? (
                <Link to="/favoritos" className="font-medium text-highlight hover:underline">
                  Ver meus favoritos
                </Link>
              ) : undefined
            }
          />
          <StatCard
            icon={Star}
            label="Filmes avaliados"
            value={formatCount(stats.totalRated)}
            hint={
              stats.totalRated > 0 ? (
                <Link to="/avaliacoes" className="font-medium text-highlight hover:underline">
                  Ver minhas avaliações
                </Link>
              ) : undefined
            }
          />
          <StatCard
            icon={ChartNoAxesColumn}
            label="Nota média"
            value={stats.averageScore === null ? '—' : formatAverage(stats.averageScore)}
            hint={stats.averageScore === null ? 'Nenhuma avaliação ainda' : 'de 10'}
          />
          <StatCard
            icon={Tags}
            label="Gênero mais frequente"
            value={stats.topGenre?.name ?? '—'}
            hint={
              stats.topGenre
                ? `${formatCount(stats.topGenre.count)} ${stats.topGenre.count === 1 ? 'favorito' : 'favoritos'}`
                : 'Nenhum favorito com gênero'
            }
          />
        </dl>

        {stats.genres.length > 0 && (
          <Card className="p-5 sm:p-6">
            <GenreChart data={genreChartData(stats.genres)} total={stats.totalFavorites} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading documentTitle="Painel">Painel</PageHeading>
      {content}
    </div>
  );
}
