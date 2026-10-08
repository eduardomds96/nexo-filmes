import { ErrorState, PageHeading } from '@nexo/ui';

/** Erro inesperado no próprio Shell (os remotes têm fronteiras próprias). */
export function RouteErrorPage() {
  return (
    <main id="conteudo" className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <PageHeading documentTitle="Erro" noIndex>
        Algo deu errado
      </PageHeading>
      <ErrorState
        message="Ocorreu um erro inesperado. Recarregue a página para continuar."
        retryLabel="Recarregar"
        onRetry={() => {
          window.location.reload();
        }}
      />
    </main>
  );
}
