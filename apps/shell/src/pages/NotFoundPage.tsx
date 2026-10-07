import { Button, PageHeading } from '@nexo/ui';
import { Clapperboard, Heart } from 'lucide-react';
import { Link } from 'react-router';

const PERFORATIONS = Array.from({ length: 9 }, (_, index) => index);

/** Fileira de furos da película. */
function Perforations() {
  return (
    <div className="flex justify-between px-3">
      {PERFORATIONS.map((index) => (
        <span key={index} className="h-3 w-4 rounded-[3px] bg-background" />
      ))}
    </div>
  );
}

/** Fotograma de película com o "404", sobre a claquete. Decorativo. */
function FilmFrame() {
  return (
    <div aria-hidden="true" className="relative w-[min(24rem,100%-2.5rem)] select-none">
      <div className="-rotate-2 rounded-xl bg-foreground py-2 shadow-lg">
        <Perforations />
        <div className="mx-3 my-2 grid aspect-[16/7] place-items-center overflow-hidden rounded-md bg-linear-to-br from-scrim via-scrim to-primary/40">
          <span className="font-display text-7xl font-extrabold tracking-tight text-on-scrim tabular-nums sm:text-8xl">
            4<span className="text-primary">0</span>4
          </span>
        </div>
        <Perforations />
      </div>
      <Clapperboard className="absolute -right-2 -bottom-5 size-14 rotate-12 rounded-xl bg-background p-2 text-highlight shadow-md" />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center sm:py-14">
      <FilmFrame />
      <div className="flex max-w-lg flex-col items-center gap-3">
        <p className="text-sm font-medium tracking-widest text-highlight uppercase">
          Página não encontrada
        </p>
        <PageHeading documentTitle="Página não encontrada" className="text-3xl sm:text-4xl">
          Esta cena foi cortada na edição
        </PageHeading>
        <p className="text-pretty text-muted-foreground">
          O endereço pode estar errado ou a página saiu de cartaz. Que tal voltar para a sessão?
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/filmes">
            <Clapperboard aria-hidden="true" />
            Ir para o catálogo
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/favoritos">
            <Heart aria-hidden="true" />
            Ver meus favoritos
          </Link>
        </Button>
      </div>
    </div>
  );
}
