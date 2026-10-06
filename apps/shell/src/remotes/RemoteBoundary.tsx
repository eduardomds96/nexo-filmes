import type { RemoteModuleId, RemoteModuleMap } from '@nexo/contracts';
import { Suspense, use, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { evictRemoteModule, getRemoteModule, remoteNameOf } from './remote-loader';

type PropsOf<Id extends RemoteModuleId> =
  RemoteModuleMap[Id] extends ComponentType<infer P> ? P : never;

export interface RemoteErrorRenderProps {
  readonly error: unknown;
  readonly areaLabel: string;
  readonly retry: () => void;
}

interface RemoteBoundaryProps<Id extends RemoteModuleId> {
  readonly id: Id;
  readonly props?: PropsOf<Id>;
  /** Nome da área, usado na mensagem de erro (ex.: "o catálogo"). */
  readonly areaLabel: string;
  readonly fallback: ReactNode;
  readonly renderError: (args: RemoteErrorRenderProps) => ReactNode;
}

function RemoteContent<Id extends RemoteModuleId>({
  id,
  props,
}: {
  id: Id;
  props: PropsOf<Id> | undefined;
}) {
  const Component = use(getRemoteModule(id)).default as ComponentType<object>;
  return <Component {...(props ?? {})} />;
}

/**
 * Carrega um módulo remoto isolando falhas: se o remote estiver fora do ar
 * ou quebrar ao renderizar, só esta área mostra o erro, com "Tentar novamente".
 */
export function RemoteBoundary<Id extends RemoteModuleId>({
  id,
  props,
  areaLabel,
  fallback,
  renderError,
}: RemoteBoundaryProps<Id>) {
  const [attempt, setAttempt] = useState(0);

  return (
    <ErrorBoundary
      resetKeys={[attempt]}
      fallbackRender={({ error }) =>
        renderError({
          error,
          areaLabel,
          retry: () => {
            evictRemoteModule(id);
            setAttempt((n) => n + 1);
          },
        })
      }
    >
      <Suspense fallback={fallback}>
        {/* Os utilitários CSS do remote valem só dentro deste contêiner (ADR 0004). */}
        <div data-nexo-remote={remoteNameOf(id)} className="contents">
          <RemoteContent id={id} props={props} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
