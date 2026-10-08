import { Star } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

import { formatScore } from '../lib/format';
import { cn } from '../lib/utils';
import { MoviePoster } from './movie-poster';
import { Skeleton } from './primitives';

export interface MovieCardLinkProps {
  readonly to: string;
  readonly className?: string;
  readonly children: ReactNode;
  /** Navegação com View Transition (o pôster viaja até o detalhe). */
  readonly viewTransition?: boolean;
}

export interface MovieCardProps {
  readonly title: string;
  readonly year: number | null;
  readonly posterUrl: string | null;
  readonly href: string;
  readonly LinkComponent: ComponentType<MovieCardLinkProps>;
  readonly details?: ReactNode;
  readonly action?: ReactNode;
  readonly posterSrcSet?: string | undefined;
  readonly priorityPoster?: boolean;
  /** Nome de View Transition do pôster, igual ao do detalhe (ex.: `poster-550`). */
  readonly transitionName?: string;
}

/**
 * Card de filme em pôster 2:3. O título é o link; um pseudo-elemento estende
 * a área clicável para o card todo, sem aninhar o botão de ação no link.
 * Nota e gêneros (`details`) aparecem sobre o pôster no hover ou foco; em
 * telas de toque ficam sempre visíveis. Continuam no DOM nos dois casos, então
 * leitores de tela sempre os leem.
 */
export function MovieCard({
  title,
  year,
  posterUrl,
  href,
  LinkComponent,
  details,
  action,
  posterSrcSet,
  priorityPoster = false,
  transitionName,
}: MovieCardProps) {
  return (
    <article className="group relative flex h-full flex-col gap-2.5">
      <div className="relative overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border/60 transition-[translate,box-shadow] duration-300 ease-out-soft group-focus-within:shadow-glow can-hover:group-hover:-translate-y-1 can-hover:group-hover:shadow-glow">
        <MoviePoster
          src={posterUrl}
          title={title}
          srcSet={posterSrcSet}
          priority={priorityPoster}
          transitionName={transitionName}
          className="rounded-none transition-transform duration-500 ease-out-soft can-hover:group-hover:scale-[1.04]"
        />
        {details && (
          <div className="on-image absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-linear-to-t from-scrim via-scrim/85 to-transparent p-3 pt-12 transition-[opacity,translate] duration-300 ease-out-soft can-hover:translate-y-2 can-hover:opacity-0 can-hover:group-hover:translate-y-0 can-hover:group-hover:opacity-100 can-hover:group-focus-within:translate-y-0 can-hover:group-focus-within:opacity-100">
            {details}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="line-clamp-2 leading-snug font-semibold">
          <LinkComponent
            to={href}
            viewTransition={transitionName !== undefined}
            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background hover:underline"
          >
            {title}
          </LinkComponent>
        </h3>
        {year !== null && <p className="text-sm text-muted-foreground tabular-nums">{year}</p>}
      </div>
      {/*
        A ação fica fora do pôster e por último no DOM: assim nunca é coberta pelo
        link que se estende sobre o card (o pôster vira um contexto de
        empilhamento quando se move no hover). Acompanha o mesmo deslocamento.
      */}
      {action && (
        <div className="absolute top-2 right-2 z-10 transition-[translate] duration-300 ease-out-soft can-hover:group-hover:-translate-y-1">
          {action}
        </div>
      )}
    </article>
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
    <div className="flex flex-col gap-2.5">
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

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
        'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4 xl:grid-cols-5',
        className,
      )}
    >
      {children}
    </ul>
  );
}
