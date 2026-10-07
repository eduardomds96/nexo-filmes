import type { RemoteModuleId } from '@nexo/contracts';
import { useLocation } from 'react-router';

import { PageSkeleton, RemotePageError } from './fallbacks';
import { RemoteBoundary } from './RemoteBoundary';

export function RemoteRoute({ id, areaLabel }: { id: RemoteModuleId; areaLabel: string }) {
  const { pathname } = useLocation();
  return (
    // A chave por caminho zera o erro ao navegar para outra página do mesmo remote.
    <RemoteBoundary
      key={pathname}
      id={id}
      areaLabel={areaLabel}
      fallback={<PageSkeleton />}
      renderError={RemotePageError}
    />
  );
}
