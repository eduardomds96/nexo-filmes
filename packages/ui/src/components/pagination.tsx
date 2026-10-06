import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

import { cn } from '../lib/utils';
import { buttonVariants } from './button';

export interface PaginationLinkProps {
  readonly to: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-current'?: 'page';
  readonly children: ReactNode;
}

export interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly hrefFor: (page: number) => string;
  /** Componente de link do roteador (ex.: `Link` do React Router). */
  readonly LinkComponent: ComponentType<PaginationLinkProps>;
  readonly className?: string;
}

/** Páginas visíveis: primeira, última e vizinhas da atual, com `null` onde há salto. */
export function visiblePages(page: number, totalPages: number): (number | null)[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  for (const [index, current] of sorted.entries()) {
    const previous = sorted[index - 1];
    if (previous !== undefined && current - previous > 1) result.push(null);
    result.push(current);
  }
  return result;
}

const disabledClass = 'pointer-events-none opacity-50';

export function Pagination({
  page,
  totalPages,
  hrefFor,
  LinkComponent,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Paginação" className={cn('flex flex-col items-center gap-3', className)}>
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          {hasPrevious ? (
            <LinkComponent
              to={hrefFor(page - 1)}
              aria-label="Página anterior"
              className={buttonVariants({ variant: 'outline', size: 'default' })}
            >
              <ChevronLeft aria-hidden="true" />
              <span className="hidden sm:inline">Anterior</span>
            </LinkComponent>
          ) : (
            <span
              aria-hidden="true"
              className={cn(buttonVariants({ variant: 'outline' }), disabledClass)}
            >
              <ChevronLeft />
              <span className="hidden sm:inline">Anterior</span>
            </span>
          )}
        </li>
        {visiblePages(page, totalPages).map((p, index) =>
          p === null ? (
            <li key={`gap-${String(index)}`} aria-hidden="true" className="hidden px-1 sm:block">
              …
            </li>
          ) : (
            <li key={p} className={cn(p !== page && 'hidden sm:block')}>
              <LinkComponent
                to={hrefFor(p)}
                aria-label={`Página ${String(p)}`}
                {...(p === page ? { 'aria-current': 'page' as const } : {})}
                className={buttonVariants({
                  variant: p === page ? 'default' : 'ghost',
                  size: 'icon',
                })}
              >
                {p}
              </LinkComponent>
            </li>
          ),
        )}
        <li>
          {hasNext ? (
            <LinkComponent
              to={hrefFor(page + 1)}
              aria-label="Próxima página"
              className={buttonVariants({ variant: 'outline', size: 'default' })}
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight aria-hidden="true" />
            </LinkComponent>
          ) : (
            <span
              aria-hidden="true"
              className={cn(buttonVariants({ variant: 'outline' }), disabledClass)}
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
