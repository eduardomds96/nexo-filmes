import { Heart } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../lib/utils';
import { buttonVariants } from './button';
import { Spinner } from './primitives';

export interface FavoriteButtonProps {
  /** Título do filme, usado no rótulo acessível. */
  readonly title: string;
  readonly isFavorite: boolean;
  readonly isPending: boolean;
  readonly onToggle: () => void;
  /** `icon` para cards; `full` mostra o texto ao lado do ícone. */
  readonly appearance?: 'icon' | 'full';
  /** `onImage`: sobre pôster ou imagem de fundo (véu escuro nos dois temas). */
  readonly tone?: 'surface' | 'onImage';
  readonly className?: string;
}

type LastAction = 'add' | 'remove' | null;

function statusMessage(title: string, isFavorite: boolean, isPending: boolean, last: LastAction) {
  if (isPending) return `Salvando ${title}…`;
  if (last === null) return '';
  const succeeded = (last === 'add') === isFavorite;
  if (!succeeded) return `Não foi possível salvar. ${title} voltou ao estado anterior.`;
  return isFavorite ? `${title} adicionado aos favoritos.` : `${title} removido dos favoritos.`;
}

/**
 * Botão de favorito (toggle). Enquanto salva, fica com `aria-disabled` em vez
 * de `disabled`: assim o foco do teclado não se perde, e cliques são ignorados.
 */
export function FavoriteButton({
  title,
  isFavorite,
  isPending,
  onToggle,
  appearance = 'icon',
  tone = 'surface',
  className,
}: FavoriteButtonProps) {
  const [lastAction, setLastAction] = useState<LastAction>(null);
  const label = isFavorite ? `Remover ${title} dos favoritos` : `Adicionar ${title} aos favoritos`;

  return (
    <>
      <button
        type="button"
        aria-pressed={isFavorite}
        aria-label={label}
        aria-busy={isPending}
        aria-disabled={isPending}
        title={label}
        onClick={() => {
          if (isPending) return;
          setLastAction(isFavorite ? 'remove' : 'add');
          onToggle();
        }}
        className={cn(
          buttonVariants({
            variant: appearance === 'icon' ? 'secondary' : 'outline',
            size: appearance === 'icon' ? 'icon' : 'default',
          }),
          'aria-disabled:cursor-progress aria-disabled:opacity-80',
          tone === 'onImage' &&
            'border-on-scrim/30 bg-scrim/60 text-on-scrim backdrop-blur-sm hover:bg-scrim/80 hover:text-on-scrim',
          isFavorite && (tone === 'onImage' ? 'text-primary hover:text-primary' : 'text-favorite'),
          className,
        )}
      >
        {isPending ? (
          <Spinner />
        ) : (
          <Heart aria-hidden="true" className={cn(isFavorite && 'fill-current')} />
        )}
        {appearance === 'full' && (
          <span aria-hidden="true">{isFavorite ? 'Nos favoritos' : 'Favoritar'}</span>
        )}
      </button>
      <span className="sr-only" aria-live="polite" role="status">
        {statusMessage(title, isFavorite, isPending, lastAction)}
      </span>
    </>
  );
}
