import '../styles/remote.css';

import { MovieScreen } from '../ui/MovieScreen';

/** Página `/filme/:id`, exposta ao Shell via Module Federation. */
export default function MoviePage() {
  return <MovieScreen />;
}
