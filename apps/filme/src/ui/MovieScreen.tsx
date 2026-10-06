import type { MovieDetails } from '@nexo/contracts';
import { isTmdbError } from '@nexo/tmdb';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FavoriteButton,
  formatRuntime,
  formatRuntimeLong,
  MoviePoster,
  PageHeading,
  Separator,
  Skeleton,
  TmdbScore,
} from '@nexo/ui';
import { useFavorite } from '@nexo/user-data';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Film, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';

import { parseMovieId } from '../domain/movie-id';
import { detailsToSnapshot } from '../domain/rating-form';
import { getTmdbClient } from '../services/tmdb';
import { RatingForm } from './RatingForm';

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="w-fit">
      <Link to="/filmes">
        <ArrowLeft aria-hidden="true" />
        Voltar ao catálogo
      </Link>
    </Button>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <PageHeading documentTitle="Filme não encontrado">Filme não encontrado</PageHeading>
      <EmptyState
        icon={<Film />}
        title="Este filme não existe ou foi removido"
        description="Confira o endereço ou procure o filme no catálogo."
        action={
          <Button asChild>
            <Link to="/filmes">Ir para o catálogo</Link>
          </Button>
        }
      />
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        Carregando filme…
      </span>
      <Skeleton className="h-9 w-40" />
      <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
        <Skeleton className="aspect-[2/3] w-full max-w-80 rounded-lg" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
    </div>
  );
}

function FavoriteToggle({ movie }: { movie: MovieDetails }) {
  const snapshot = useMemo(() => detailsToSnapshot(movie), [movie]);
  const favorite = useFavorite(snapshot, {
    onReverted: () => {
      toast.error(`Não foi possível salvar "${movie.title}" nos favoritos.`, {
        description: 'A alteração foi desfeita. Tente novamente em instantes.',
      });
    },
  });
  return (
    <FavoriteButton
      appearance="full"
      className="w-fit"
      title={movie.title}
      isFavorite={favorite.isFavorite}
      isPending={favorite.isPending}
      onToggle={() => void favorite.toggle()}
    />
  );
}

function Details({ movie }: { movie: MovieDetails }) {
  return (
    <article className="flex flex-col gap-6">
      <BackLink />
      <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-10">
        <MoviePoster
          src={movie.posterUrl}
          title={movie.title}
          size="detail"
          eager
          className="mx-auto max-w-72 md:max-w-none"
        />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <PageHeading documentTitle={movie.title}>
              {movie.title}
              {movie.year !== null && (
                <span className="ml-2 font-normal text-muted-foreground">({movie.year})</span>
              )}
            </PageHeading>
            {movie.tagline && <p className="text-muted-foreground italic">{movie.tagline}</p>}
          </div>

          <dl className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Nota da TMDB</dt>
              <dd>
                <TmdbScore value={movie.voteAverage} />
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Duração</dt>
              <dd className="flex items-center gap-1">
                <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
                {movie.runtimeMinutes === null ? (
                  'Duração não informada'
                ) : (
                  <>
                    <span aria-hidden="true">{formatRuntime(movie.runtimeMinutes)}</span>
                    <span className="sr-only">{formatRuntimeLong(movie.runtimeMinutes)}</span>
                  </>
                )}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Gêneros</dt>
              <dd>
                {movie.genres.length > 0 ? (
                  <ul className="flex flex-wrap gap-1">
                    {movie.genres.map((genre) => (
                      <li key={genre.id}>
                        <Badge>{genre.name}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Gêneros não informados'
                )}
              </dd>
            </div>
          </dl>

          <FavoriteToggle movie={movie} />

          <section aria-labelledby="sinopse" className="flex flex-col gap-2">
            <h2 id="sinopse" className="text-xl font-semibold">
              Sinopse
            </h2>
            <p className="max-w-prose leading-relaxed">
              {movie.overview || 'Sinopse não disponível em português.'}
            </p>
          </section>

          <section aria-labelledby="direcao" className="flex flex-col gap-2">
            <h2 id="direcao" className="text-xl font-semibold">
              Direção
            </h2>
            <p>
              {movie.directors.length > 0
                ? movie.directors.map((d) => d.name).join(', ')
                : 'Direção não informada.'}
            </p>
          </section>
        </div>
      </div>

      <section aria-labelledby="elenco" className="flex flex-col gap-3">
        <h2 id="elenco" className="text-xl font-semibold">
          Elenco
        </h2>
        {movie.cast.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {movie.cast.map((member) => (
              <li key={member.id} className="flex items-center gap-3 rounded-lg border p-2">
                {member.profileUrl ? (
                  <img
                    src={member.profileUrl}
                    alt=""
                    width={48}
                    height={72}
                    loading="lazy"
                    className="h-[72px] w-12 shrink-0 rounded-md bg-muted object-cover"
                  />
                ) : (
                  <span className="flex h-[72px] w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                    <UserRound aria-hidden="true" className="size-5 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium">{member.name}</span>
                  {member.character && (
                    <span className="block truncate text-sm text-muted-foreground">
                      {member.character}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Elenco não informado.</p>
        )}
      </section>

      <Separator />

      <RatingForm movie={movie} />
    </article>
  );
}

export function MovieScreen() {
  const params = useParams();
  const movieId = parseMovieId(params['id']);
  const tmdb = getTmdbClient();

  const query = useQuery({
    queryKey: ['tmdb', 'movie', movieId],
    queryFn: ({ signal }) => tmdb.getMovieDetails(movieId ?? 0, signal),
    enabled: movieId !== null,
  });

  if (movieId === null) return <NotFound />;
  if (query.isPending) return <DetailsSkeleton />;
  if (query.isError) {
    const error = query.error;
    if (isTmdbError(error) && error.kind === 'not-found') return <NotFound />;
    const rateLimited = isTmdbError(error) && error.kind === 'rate-limit';
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <PageHeading documentTitle="Erro ao carregar filme">Detalhe do filme</PageHeading>
        <ErrorState
          title={rateLimited ? 'Muitas requisições' : 'Não foi possível carregar o filme'}
          message={error.message}
          isRetrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }
  return <Details movie={query.data} />;
}
