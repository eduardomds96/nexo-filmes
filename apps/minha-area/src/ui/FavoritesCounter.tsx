import type { FavoritesCounterProps } from '@nexo/contracts';
import { buttonVariants, cn, formatCount } from '@nexo/ui';
import { useFavoritesCount, useUserDataStatus } from '@nexo/user-data';
import { Heart } from 'lucide-react';
import { Link } from 'react-router';

/** Contador do cabeçalho: muda na hora, em qualquer tela, sem recarregar. */
export function FavoritesCounter({ className }: FavoritesCounterProps) {
  const count = useFavoritesCount();
  const status = useUserDataStatus();
  const loading = status === 'idle' || status === 'loading';

  const label = loading
    ? 'Favoritos (carregando)'
    : `Favoritos: ${count === 1 ? '1 filme' : `${formatCount(count)} filmes`}`;

  return (
    <Link
      to="/favoritos"
      aria-label={label}
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5', className)}
    >
      <Heart aria-hidden="true" className={cn('text-favorite', count > 0 && 'fill-current')} />
      <span aria-hidden="true" className="hidden sm:inline">
        Favoritos
      </span>
      <span
        aria-hidden="true"
        className="min-w-6 rounded-full bg-secondary px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums"
      >
        {loading ? '…' : formatCount(count)}
      </span>
    </Link>
  );
}
