import type { Movie } from '@nexo/contracts';
import { tmdbPosterSrcSet } from '@nexo/tmdb';
import { Badge, FavoriteButton, MovieCard, TmdbScore } from '@nexo/ui';
import { useFavorite } from '@nexo/user-data';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { toSnapshot } from '../domain/catalog-request';
import { RouterLink } from './RouterLink';

export function CatalogMovieCard({ movie, priority }: { movie: Movie; priority: boolean }) {
  const snapshot = useMemo(() => toSnapshot(movie), [movie]);
  const favorite = useFavorite(snapshot, {
    onReverted: () => {
      toast.error(`Não foi possível salvar "${movie.title}" nos favoritos.`, {
        description: 'A alteração foi desfeita. Tente novamente em instantes.',
      });
    },
  });

  return (
    <MovieCard
      title={movie.title}
      year={movie.year}
      posterUrl={movie.posterUrl}
      href={`/filme/${String(movie.id)}`}
      LinkComponent={RouterLink}
      posterSrcSet={tmdbPosterSrcSet(movie.posterUrl)}
      priorityPoster={priority}
      transitionName={`poster-${String(movie.id)}`}
      action={
        <FavoriteButton
          tone="onImage"
          className="size-9 rounded-full"
          title={movie.title}
          isFavorite={favorite.isFavorite}
          isPending={favorite.isPending}
          onToggle={() => void favorite.toggle()}
        />
      }
      details={
        <>
          <TmdbScore value={movie.voteAverage} />
          {movie.genres.length > 0 && (
            <ul aria-label="Gêneros" className="flex flex-wrap gap-1">
              {movie.genres.slice(0, 3).map((genre) => (
                <li key={genre.id}>
                  <Badge>{genre.name}</Badge>
                </li>
              ))}
            </ul>
          )}
        </>
      }
    />
  );
}
