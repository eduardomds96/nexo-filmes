import { Button, Card, EmptyState, ErrorState, PageHeading, Skeleton, formatCount } from '@nexo/ui';
import { useFavorites, useRatings, useUserDataStatus, useUserDataStore } from '@nexo/user-data';
import { ChartNoAxesColumn, Heart, Star, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { computeDashboard, formatAverage } from '../domain/dashboard';

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
    <Card className="gap-2 p-5">
      <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </dt>
      <dd className="text-3xl font-bold tracking-tight">{value}</dd>
      {hint && <dd className="text-sm text-muted-foreground">{hint}</dd>}
    </Card>
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
    content = (
      <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <span role="status" className="sr-only">
          Carregando painel…
        </span>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    );
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
        icon={<ChartNoAxesColumn />}
        title="Seu painel está vazio"
        description="Favorite e avalie filmes para ver seus números aqui."
        action={
          <Button asChild>
            <Link to="/filmes">Explorar filmes</Link>
          </Button>
        }
      />
    );
  } else {
    content = (
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Heart} label="Favoritos" value={formatCount(stats.totalFavorites)} />
        <StatCard icon={Star} label="Filmes avaliados" value={formatCount(stats.totalRated)} />
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
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading documentTitle="Painel">Painel</PageHeading>
      {content}
    </div>
  );
}
