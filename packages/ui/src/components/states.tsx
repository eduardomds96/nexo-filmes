import { CircleAlert, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  /** Ilustração grande no lugar do ícone (ver illustrations.tsx). */
  readonly illustration?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  illustration,
  action,
  className,
}: EmptyStateProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center',
        illustration && 'gap-4 bg-linear-to-b from-card/80 to-transparent py-14',
        className,
      )}
    >
      {illustration ?? (
        <span aria-hidden="true" className="text-muted-foreground [&_svg]:size-10">
          {icon ?? <SearchX />}
        </span>
      )}
      <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
      {description && (
        <div className="max-w-prose text-pretty text-muted-foreground">{description}</div>
      )}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </section>
  );
}

export interface ErrorStateProps {
  readonly title?: string;
  readonly message: ReactNode;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly isRetrying?: boolean;
  readonly className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}
    >
      <CircleAlert aria-hidden="true" className="size-10 text-destructive" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="max-w-prose text-muted-foreground">{message}</div>
      {onRetry && (
        <Button type="button" onClick={onRetry} aria-busy={isRetrying} disabled={isRetrying}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
