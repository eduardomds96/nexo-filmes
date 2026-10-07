import { Heart } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../lib/utils';
import { buttonVariants } from './button';

export interface FavoriteButtonProps {
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

type HeartPhase = 'idle' | 'saving' | 'added' | 'reverted';

function heartPhase(isFavorite: boolean, isPending: boolean, last: LastAction): HeartPhase {
  if (isPending) return 'saving';
  if (last === null) return 'idle';
  const succeeded = (last === 'add') === isFavorite;
  if (!succeeded) return 'reverted';
  return last === 'add' ? 'added' : 'idle';
}

const HEART_ANIMATION: Record<HeartPhase, string> = {
  idle: '',
  saving: 'motion-safe:animate-heart-pulse',
  added: 'motion-safe:animate-heart-pop',
  reverted: 'motion-safe:animate-heart-shake',
};

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
  // Cada clique reinicia as animações (a chave do ícone muda).
  const [clicks, setClicks] = useState(0);
  const phase = heartPhase(isFavorite, isPending, lastAction);
  const label = isFavorite ? `Remover ${title} dos favoritos` : `Adicionar ${title} aos favoritos`;

  return (
    <>
      <button
        type="button"
        aria-pressed={isFavorite}
        aria-label={label}
        aria-busy={isPending}
        aria-disabled={isPending}
        data-heart={phase}
        title={label}
        onClick={() => {
          if (isPending) return;
          setLastAction(isFavorite ? 'remove' : 'add');
          setClicks((n) => n + 1);
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
        {/*
          Salvando: o coração pulsa. Salvo: estala, com um anel que se expande.
          Falhou: treme e volta ao estado anterior (o leitor de tela ouve o aviso).
        */}
        <span className="relative grid place-items-center">
          <Heart
            key={`${phase}-${String(clicks)}`}
            aria-hidden="true"
            className={cn(
              'transition-[fill] duration-200',
              isFavorite && 'fill-current',
              HEART_ANIMATION[phase],
            )}
          />
          {phase === 'added' && (
            <span
              key={clicks}
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-6px] rounded-full border-2 border-current opacity-0 motion-safe:animate-heart-burst"
            />
          )}
        </span>
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
