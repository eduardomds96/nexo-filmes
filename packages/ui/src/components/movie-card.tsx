import { Star } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

import { formatScore } from '../lib/format';
import { cn } from '../lib/utils';
import { MoviePoster } from './movie-poster';
import { Card, Skeleton } from './primitives';

export interface MovieCardLinkProps {
  readonly to: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export interface MovieCardProps {
  readonly title: string;
  readonly year: number | null;
  readonly posterUrl: string | null;
  readonly href: string;
  readonly LinkComponent: ComponentType<MovieCardLinkProps>;
  /** Linhas extras abaixo do título (nota, gêneros...). */
  readonly details?: ReactNode;
  /** Ação no canto do pôster (ex.: botão de favorito). */
  readonly action?: ReactNode;
  readonly eagerPoster?: boolean;
}

/**
 * Card de filme. O título é o link; um pseudo-elemento estende a área
 * clicável para o card todo, sem aninhar o botão de ação dentro do link.
 */
export function MovieCard({
  title,
  year,
  posterUrl,
  href,
  LinkComponent,
  details,
  action,
  eagerPoster = false,
}: MovieCardProps) {
  return (
    <Card className="group relative h-full gap-3 p-3 transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="relative">
        <MoviePoster src={posterUrl} title={title} eager={eagerPoster} />
        {action && <div className="absolute top-2 right-2 z-10">{action}</div>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <h3 className="leading-snug font-semibold">
          <LinkComponent
            to={href}
            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring hover:underline"
          >
            {title}
          </LinkComponent>
        </h3>
        {year !== null && <p className="text-sm text-muted-foreground tabular-nums">{year}</p>}
        {details}
      </div>
    </Card>
  );
}

export function TmdbScore({ value, className }: { value: number; className?: string }) {
  return (
    <p className={cn('flex items-center gap-1 text-sm font-medium tabular-nums', className)}>
      <Star aria-hidden="true" className="size-4 fill-current text-rating" />
      <span aria-hidden="true">{formatScore(value)}</span>
      <span className="sr-only">Nota da TMDB: {formatScore(value)} de 10</span>
    </p>
  );
}

export function MovieCardSkeleton() {
  return (
    <Card className="gap-3 p-3">
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-2/5" />
    </Card>
  );
}

/** Grade responsiva usada no catálogo e nos favoritos (2 colunas em 360 px). */
export function MovieGrid({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5',
        className,
      )}
    >
      {children}
    </ul>
  );
}
