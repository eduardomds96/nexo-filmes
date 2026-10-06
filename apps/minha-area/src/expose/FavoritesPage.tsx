import '../styles/remote.css';

import { FavoritesScreen } from '../ui/FavoritesScreen';

/** Página `/favoritos`, exposta ao Shell via Module Federation. */
export default function FavoritesPage() {
  return <FavoritesScreen />;
}
