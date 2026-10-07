import type { MovieSnapshot, Rating } from '@nexo/contracts';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  formatUserScore,
  Label,
  MoviePoster,
  NativeSelect,
  PageHeading,
  plural,
  Skeleton,
  Spinner,
} from '@nexo/ui';
import { useRatings, useUserDataStatus, useUserDataStore } from '@nexo/user-data';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareText, Pencil, Star, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { formatAverage } from '../domain/dashboard';
import {
  parseRatingsOrder,
  RATINGS_ORDERS,
  sortRatings,
  summarizeRatings,
  wasEdited,
} from '../domain/ratings';
import { getTmdbClient } from '../services/tmdb';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });

/**
 * Avaliações gravadas antes de o snapshot existir não sabem o título do
 * filme: ele é buscado na TMDB (com o mesmo cache do detalhe).
 */
function useMovieOf(rating: Rating): MovieSnapshot | null {
  const tmdb = getTmdbClient();
  const query = useQuery({
    queryKey: ['tmdb', 'movie', rating.movieId],
    queryFn: ({ signal }) => tmdb.getMovieDetails(rating.movieId, signal),
    enabled: rating.movie === null,
  });
  if (rating.movie) return rating.movie;
  if (!query.data) return null;
  const { id, title, year, posterThumbUrl, genres } = query.data;
  return { id, title, year, posterUrl: posterThumbUrl, genres };
}

function RatingCard({ rating, onDeleted }: { rating: Rating; onDeleted: (title: string) => void }) {
  const store = useUserDataStore();
  const movie = useMovieOf(rating);
  const [deleting, setDeleting] = useState(false);
  const title = movie?.title ?? `Filme ${String(rating.movieId)}`;
  const href = `/filme/${String(rating.movieId)}`;

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await store.deleteRating(rating.movieId);
      onDeleted(title);
      toast.success(`Avaliação de "${title}" excluída.`, {
        action: {
          label: 'Desfazer',
          onClick: () => {
            void store
              .saveRating({
                movieId: rating.movieId,
                score: rating.score,
                comment: rating.comment,
                ...(movie ? { movie } : {}),
              })
              .catch(() => {
                toast.error('Não foi possível restaurar a avaliação.');
              });
          },
        },
      });
    } catch {
      setDeleting(false);
      toast.error(`Não foi possível excluir a avaliação de "${title}".`, {
        description: 'Tente novamente em instantes.',
      });
    }
  };

  return (
    <Card className="flex-row gap-4 p-3 sm:p-4">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="w-20 shrink-0 sm:w-24">
        <MoviePoster src={movie?.posterUrl ?? null} title={title} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-lg leading-snug font-semibold">
            <Link to={href} className="hover:underline">
              {title}
            </Link>
            {movie?.year != null && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({movie.year})</span>
            )}
          </h2>
          <p className="flex items-center gap-1 font-semibold">
            <Star aria-hidden="true" className="size-4 fill-current text-primary" />
            <span className="sr-only">Sua nota:</span>
            {formatUserScore(rating.score)}
            <span className="text-sm font-normal text-muted-foreground">/10</span>
          </p>
        </div>

        {rating.comment ? (
          <blockquote className="border-l-2 pl-3 break-words whitespace-pre-line">
            {rating.comment}
          </blockquote>
        ) : (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquareText aria-hidden="true" className="size-4" />
            Sem comentário
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Avaliado em {dateFormat.format(new Date(rating.createdAt))}
          {wasEdited(rating) && ` · editado em ${dateFormat.format(new Date(rating.updatedAt))}`}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`${href}#avaliacao`} aria-label={`Editar avaliação de ${title}`}>
              <Pencil aria-hidden="true" />
              Editar
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Excluir avaliação de ${title}`}
            aria-busy={deleting}
            aria-disabled={deleting}
            onClick={() => void remove()}
          >
            {deleting ? <Spinner /> : <Trash2 aria-hidden="true" />}
            Excluir
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <ul aria-busy="true" className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index}>
          <Card className="flex-row gap-4 p-4">
            <Skeleton className="aspect-[2/3] w-20 rounded-lg sm:w-24" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function RatingsScreen() {
  const store = useUserDataStore();
  const status = useUserDataStatus();
  const ratings = useRatings();
  const [searchParams, setSearchParams] = useSearchParams();
  const order = parseRatingsOrder(searchParams.get('ordem'));
  const [announcement, setAnnouncement] = useState('');
  const summaryRef = useRef<HTMLParagraphElement>(null);

  const list = sortRatings([...ratings.values()], order);
  const summary = summarizeRatings(list);

  let content;
  if (status === 'idle' || status === 'loading') {
    content = <ListSkeleton />;
  } else if (status === 'error') {
    content = (
      <ErrorState
        title="Não foi possível carregar suas avaliações"
        message="Tente novamente em instantes."
        onRetry={() => void store.load()}
      />
    );
  } else if (list.length === 0) {
    content = (
      <EmptyState
        icon={<Star />}
        title="Você ainda não avaliou nenhum filme"
        description="Abra um filme e dê sua nota. Suas avaliações aparecem aqui."
        action={
          <Button asChild>
            <Link to="/filmes">Explorar filmes</Link>
          </Button>
        }
      />
    );
  } else {
    content = (
      <ul className="flex flex-col gap-3">
        {list.map((rating) => (
          <li key={rating.movieId}>
            <RatingCard
              rating={rating}
              onDeleted={(title) => {
                setAnnouncement(`Avaliação de ${title} excluída.`);
                // O card some: o foco vai para o resumo, para não se perder.
                summaryRef.current?.focus();
              }}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading documentTitle="Minhas avaliações">Minhas avaliações</PageHeading>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p ref={summaryRef} tabIndex={-1} className="text-muted-foreground">
          {status === 'ready' && summary.count > 0
            ? `${plural(summary.count, 'filme avaliado', 'filmes avaliados')} · média ${formatAverage(summary.average ?? 0)}`
            : ''}
        </p>
        {status === 'ready' && summary.count > 1 && (
          <div className="flex flex-col gap-2 sm:w-56">
            <Label htmlFor="ordem-avaliacoes">Ordenar por</Label>
            <NativeSelect
              id="ordem-avaliacoes"
              value={order}
              onChange={(event) => {
                const next = parseRatingsOrder(event.target.value);
                setSearchParams(next === 'recentes' ? {} : { ordem: next }, { replace: true });
              }}
            >
              {RATINGS_ORDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {content}
    </div>
  );
}
