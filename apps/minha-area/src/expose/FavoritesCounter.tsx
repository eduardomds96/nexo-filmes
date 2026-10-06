import type { FavoritesCounterProps } from '@nexo/contracts';
import { Link } from 'react-router';

export default function FavoritesCounter({ className }: FavoritesCounterProps) {
  return (
    <Link to="/favoritos" className={className}>
      Favoritos: 0
    </Link>
  );
}
