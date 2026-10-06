import { Button, EmptyState, PageHeading } from '@nexo/ui';
import { MapPinOff } from 'lucide-react';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading documentTitle="Página não encontrada">Página não encontrada</PageHeading>
      <EmptyState
        icon={<MapPinOff />}
        title="Este endereço não existe"
        description="O link pode estar quebrado ou a página foi removida."
        action={
          <Button asChild>
            <Link to="/filmes">Ir para o catálogo</Link>
          </Button>
        }
      />
    </div>
  );
}
