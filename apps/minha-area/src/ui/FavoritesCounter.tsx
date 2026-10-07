import type { FavoritesCounterProps } from '@nexo/contracts';
import { buttonVariants, cn, formatCount } from '@nexo/ui';
import { useFavoritesCount, useUserDataStatus } from '@nexo/user-data';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

/** Sentido da última mudança, para o número entrar subindo (mais) ou descendo (menos). */
function useChangeDirection(value: number): 'up' | 'down' | null {
  const [state, setState] = useState({ value, direction: null as 'up' | 'down' | null });
  if (state.value !== value) {
    setState({ value, direction: value > state.value ? 'up' : 'down' });
  }
  return state.direction;
}

export function FavoritesCounter({ className }: FavoritesCounterProps) {
  const count = useFavoritesCount();
  const status = useUserDataStatus();
  const loading = status === 'idle' || status === 'loading';
  const direction = useChangeDirection(count);

  const label = loading
    ? 'Favoritos (carregando)'
    : `Favoritos: ${count === 1 ? '1 filme' : `${formatCount(count)} filmes`}`;

  return (
    <Link
      to="/favoritos"
      aria-label={label}
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5', className)}
    >
      <Heart
        aria-hidden="true"
        className={cn('text-favorite transition-[fill]', count > 0 && 'fill-current')}
      />
      <span aria-hidden="true" className="hidden sm:inline">
        Favoritos
      </span>
      <span
        aria-hidden="true"
        className="inline-grid min-w-6 overflow-hidden rounded-full bg-secondary px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums"
      >
        {/* A chave muda a cada valor: o número novo entra animado. */}
        <span
          key={loading ? 'carregando' : count}
          data-direction={direction ?? undefined}
          className={cn(
            direction === 'up' && 'animate-count-up',
            direction === 'down' && 'animate-count-down',
          )}
        >
          {loading ? '…' : formatCount(count)}
        </span>
      </span>
    </Link>
  );
}
