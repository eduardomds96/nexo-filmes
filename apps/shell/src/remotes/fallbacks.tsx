import { Button, ErrorState, MovieCardSkeleton, MovieGrid, Skeleton } from '@nexo/ui';
import { RotateCw } from 'lucide-react';

import type { RemoteErrorRenderProps } from './RemoteBoundary';

export function PageSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only" role="status">
        Carregando…
      </span>
      <Skeleton className="h-9 w-56" />
      <MovieGrid>
        {Array.from({ length: 10 }, (_, index) => (
          <li key={index}>
            <MovieCardSkeleton />
          </li>
        ))}
      </MovieGrid>
    </div>
  );
}

export function CounterSkeleton() {
  return <Skeleton className="h-9 w-16 rounded-full" />;
}

/** Erro de uma área de página: só ela é afetada, o resto do portal segue funcionando. */
export function RemotePageError({ areaLabel, retry }: RemoteErrorRenderProps) {
  return (
    <ErrorState
      title={`Não foi possível carregar ${areaLabel}`}
      message="Esta parte do portal está indisponível no momento. O restante continua funcionando."
      onRetry={retry}
    />
  );
}

export function RemoteWidgetError({ areaLabel, retry }: RemoteErrorRenderProps) {
  return (
    <div role="alert" className="flex items-center">
      <span className="sr-only">Não foi possível carregar {areaLabel}.</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={retry}
        title={`Tentar carregar ${areaLabel} novamente`}
      >
        <RotateCw aria-hidden="true" />
        Tentar novamente
      </Button>
    </div>
  );
}
