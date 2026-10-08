import type { FavoriteMovie } from '@nexo/contracts';
import { tmdbPosterSrcSet } from '@nexo/tmdb';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FavoriteButton,
  formatUserScore,
  MovieCard,
  MovieCardSkeleton,
  MovieGrid,
  PageHeading,
  plural,
  PopcornHeartArt,
} from '@nexo/ui';
import {
  useFavorite,
  useFavorites,
  useRatings,
  useUserDataStatus,
  useUserDataStore,
} from '@nexo/user-data';
import { Heart, Star } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { withUserScores } from '../domain/dashboard';
import type { FavoriteWithRating } from '../domain/dashboard';
import { RouterLink } from './RouterLink';

function UserScore({ score }: { score: number | null }) {
  if (score === null) return <p className="text-sm text-muted-foreground">Sem sua avaliação</p>;
  return (
    <p className="flex items-center gap-1 text-sm font-medium">
      <Star aria-hidden="true" className="size-4 text-highlight" />
      Sua nota: {formatUserScore(score)}
    </p>
  );
}

function FavoriteCard({
  movie,
  priority,
  onRemoved,
}: {
  movie: FavoriteWithRating;
  priority: boolean;
  onRemoved: (movie: FavoriteMovie) => void;
}) {
  const favorite = useFavorite(movie, {
    onReverted: () => {
      toast.error(`Não foi possível remover "${movie.title}" dos favoritos.`, {
        description: 'O filme voltou para a lista. Tente novamente em instantes.',
      });
    },
  });

  return (
    <MovieCard
      title={movie.title}
      year={movie.year}
      posterUrl={movie.posterUrl}
      posterSrcSet={tmdbPosterSrcSet(movie.posterUrl)}
      priorityPoster={priority}
      href={`/filme/${String(movie.id)}`}
      LinkComponent={RouterLink}
      transitionName={`poster-${String(movie.id)}`}
      action={
        <FavoriteButton
          tone="onImage"
          className="size-9 rounded-full"
          title={movie.title}
          isFavorite={favorite.isFavorite}
          isPending={favorite.isPending}
          onToggle={() => {
            onRemoved(movie);
            void favorite.toggle();
          }}
        />
      }
      details={
        <>
          <UserScore score={movie.userScore} />
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

export function FavoritesScreen() {
  const store = useUserDataStore();
  const status = useUserDataStatus();
  const favorites = useFavorites();
  const ratings = useRatings();
  const [announcement, setAnnouncement] = useState('');
  const summaryRef = useRef<HTMLParagraphElement>(null);

  const items = withUserScores(favorites, ratings);

  const handleRemoved = (movie: FavoriteMovie) => {
    setAnnouncement(`${movie.title} removido dos favoritos.`);
    // O card some da lista: o foco vai para o resumo, para não se perder.
    summaryRef.current?.focus();
  };

  let content;
  if (status === 'idle' || status === 'loading') {
    content = (
      <MovieGrid>
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index}>
            <MovieCardSkeleton />
          </li>
        ))}
      </MovieGrid>
    );
  } else if (status === 'error') {
    content = (
      <ErrorState
        title="Não foi possível carregar seus favoritos"
        message="Tente novamente em instantes."
        onRetry={() => void store.load()}
      />
    );
  } else if (items.length === 0) {
    content = (
      <EmptyState
        illustration={<PopcornHeartArt />}
        title="Você ainda não tem favoritos"
        description={
          <>
            Toque no <Heart aria-hidden="true" className="inline size-4 align-[-2px]" /> coração de
            um filme no catálogo para guardá-lo aqui e montar sua lista para a próxima sessão.
          </>
        }
        action={
          <Button asChild size="lg">
            <Link to="/filmes">Explorar filmes</Link>
          </Button>
        }
      />
    );
  } else {
    content = (
      <MovieGrid>
        {items.map((movie, index) => (
          <li key={movie.id}>
            <FavoriteCard movie={movie} priority={index < 4} onRemoved={handleRemoved} />
          </li>
        ))}
      </MovieGrid>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading documentTitle="Favoritos" noIndex>
        Seus favoritos
      </PageHeading>
      <p ref={summaryRef} tabIndex={-1} className="text-sm text-muted-foreground">
        {status === 'ready' ? `${plural(items.length, 'filme', 'filmes')} na sua lista.` : ''}
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {content}
    </div>
  );
}
