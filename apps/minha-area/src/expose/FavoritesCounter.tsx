import '../styles/remote.css';

import type { FavoritesCounterProps } from '@nexo/contracts';

import { FavoritesCounter as Counter } from '../ui/FavoritesCounter';

export default function FavoritesCounter(props: FavoritesCounterProps) {
  return <Counter {...props} />;
}
