import type { RemoteErrorRenderProps } from './RemoteBoundary';

export function RemoteErrorPanel({ areaLabel, retry }: RemoteErrorRenderProps) {
  return (
    <div role="alert">
      <p>Não foi possível carregar {areaLabel}.</p>
      <button type="button" onClick={retry}>
        Tentar novamente
      </button>
    </div>
  );
}
