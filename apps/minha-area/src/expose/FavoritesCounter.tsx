import '../styles/remote.css';

import type { FavoritesCounterProps } from '@nexo/contracts';

import { FavoritesCounter as Counter } from '../ui/FavoritesCounter';

/** Widget do cabeçalho, exposto ao Shell via Module Federation. */
export default function FavoritesCounter(props: FavoritesCounterProps) {
  return <Counter {...props} />;
}
