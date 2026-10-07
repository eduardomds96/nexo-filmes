import type { MovieDetails } from '@nexo/contracts';
import { isTmdbError } from '@nexo/tmdb';
import {
  Button,
  cn,
  EmptyState,
  ErrorState,
  FavoriteButton,
  formatRuntime,
  formatRuntimeLong,
  MoviePoster,
  PageHeading,
  plural,
  ScoreRing,
  Separator,
  Skeleton,
  useImageFade,
} from '@nexo/ui';
import { useFavorite } from '@nexo/user-data';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Film } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';

import { parseMovieId } from '../domain/movie-id';
import { detailsToSnapshot } from '../domain/rating-form';
import { getTmdbClient } from '../services/tmdb';
import { CastCarousel } from './CastCarousel';
import { RatingForm } from './RatingForm';

function BackLink({ onImage = false }: { onImage?: boolean }) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn('w-fit', onImage && 'text-on-scrim hover:bg-on-scrim/10 hover:text-on-scrim')}
    >
      <Link to="/filmes" viewTransition>
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

/** Mesmo desenho do hero carregado, para não haver salto de layout. */
function DetailsSkeleton({ movieId }: { movieId: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-section">
      <span role="status" className="sr-only">
        Carregando filme…
      </span>
      <div className="-mx-gutter -mt-6 flex flex-col gap-6 bg-muted p-gutter pt-14 pb-8 sm:mx-0 sm:mt-0 sm:rounded-2xl sm:p-8 sm:pt-20 md:flex-row md:items-end md:gap-10 md:p-10 md:pt-24">
        <Skeleton
          style={{ viewTransitionName: `poster-${String(movieId)}` }}
          className="aspect-[2/3] w-36 rounded-lg bg-secondary sm:w-44 md:-mb-24 md:w-64 md:shrink-0"
        />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-10 w-3/4 bg-secondary" />
          <Skeleton className="h-5 w-1/3 bg-secondary" />
          <Skeleton className="h-14 w-40 rounded-full bg-secondary" />
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-[16rem_1fr] md:gap-10 md:px-10">
        <Skeleton className="hidden h-16 md:mt-24 md:block" />
        <Skeleton className="h-28 w-full" />
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
      tone="onImage"
      className="w-fit"
      title={movie.title}
      isFavorite={favorite.isFavorite}
      isPending={favorite.isPending}
      onToggle={() => void favorite.toggle()}
    />
  );
}

/** Imagem de fundo do hero: aparece suavemente, já atenuada pelo véu. */
function Backdrop({ src }: { src: string }) {
  const fade = useImageFade();
  return (
    <img
      src={src}
      alt=""
      width={1280}
      height={720}
      decoding="async"
      {...fade}
      className="size-full object-cover object-top opacity-0 transition-opacity duration-700 data-loaded:opacity-70"
    />
  );
}

/**
 * Topo do detalhe: imagem de fundo com véu (sempre escuro, nos dois temas),
 * pôster que avança sobre o conteúdo abaixo e os dados principais do filme.
 */
function Hero({ movie }: { movie: MovieDetails }) {
  return (
    <header className="relative isolate -mx-gutter -mt-6 bg-scrim text-on-scrim sm:mx-0 sm:mt-0 sm:rounded-2xl">
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden sm:rounded-2xl">
        {movie.backdropUrl && <Backdrop src={movie.backdropUrl} />}
        {/* Véu: garante o contraste do texto sobre qualquer imagem. */}
        <div className="absolute inset-0 bg-linear-to-t from-scrim via-scrim/85 to-scrim/30 md:bg-linear-to-r md:from-scrim md:via-scrim/80 md:to-scrim/10" />
      </div>

      <div className="flex flex-col gap-6 p-gutter pt-3 pb-8 sm:p-8 md:p-10">
        <BackLink onImage />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
          <MoviePoster
            src={movie.posterUrl}
            title={movie.title}
            size="detail"
            eager
            transitionName={`poster-${String(movie.id)}`}
            className="w-36 shadow-lg ring-1 ring-on-scrim/15 sm:w-44 md:relative md:z-10 md:-mb-24 md:w-64 md:shrink-0"
          />

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <PageHeading
                documentTitle={movie.title}
                className="text-3xl leading-tight sm:text-4xl md:text-display"
              >
                {movie.title}
                {movie.year !== null && (
                  <span className="ml-2 font-normal text-on-scrim-muted tabular-nums">
                    ({movie.year})
                  </span>
                )}
              </PageHeading>
              {movie.tagline && <p className="text-on-scrim-muted italic">{movie.tagline}</p>}
            </div>

            <dl className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm">
              <div className="flex items-center">
                <dt className="sr-only">Nota da TMDB</dt>
                <dd className="flex items-center gap-3">
                  <ScoreRing value={movie.voteAverage} />
                  <span aria-hidden="true" className="flex flex-col leading-tight">
                    <span className="font-medium">Nota TMDB</span>
                    <span className="text-on-scrim-muted tabular-nums">
                      {plural(movie.voteCount, 'voto', 'votos')}
                    </span>
                  </span>
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="sr-only">Duração</dt>
                <dd className="flex items-center gap-1.5 tabular-nums">
                  <Clock aria-hidden="true" className="size-4 text-on-scrim-muted" />
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
              <div className="flex w-full items-center">
                <dt className="sr-only">Gêneros</dt>
                <dd>
                  {movie.genres.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {movie.genres.map((genre) => (
                        <li
                          key={genre.id}
                          className="rounded-full border border-on-scrim/20 bg-on-scrim/10 px-3 py-1 text-xs font-medium"
                        >
                          {genre.name}
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
          </div>
        </div>
      </div>
    </header>
  );
}

function Details({ movie }: { movie: MovieDetails }) {
  const castHeading = (
    <h2 id="elenco" className="text-xl font-semibold">
      Elenco
    </h2>
  );
  return (
    <article className="flex flex-col gap-section">
      <Hero movie={movie} />

      {/* Na tela larga, a direção fica sob o pôster e a sinopse ao lado. */}
      <div className="grid gap-8 md:grid-cols-[16rem_1fr] md:gap-10 md:px-10">
        <section aria-labelledby="sinopse" className="flex flex-col gap-2 md:col-start-2">
          <h2 id="sinopse" className="text-xl font-semibold">
            Sinopse
          </h2>
          <p className="max-w-prose text-lg leading-relaxed text-pretty">
            {movie.overview || 'Sinopse não disponível em português.'}
          </p>
        </section>

        <section
          aria-labelledby="direcao"
          className="flex flex-col gap-2 md:col-start-1 md:row-start-1 md:pt-24"
        >
          <h2 id="direcao" className="text-lg font-semibold">
            Direção
          </h2>
          <p className="text-muted-foreground">
            {movie.directors.length > 0
              ? movie.directors.map((d) => d.name).join(', ')
              : 'Direção não informada.'}
          </p>
        </section>
      </div>

      <section aria-labelledby="elenco" className="flex flex-col gap-3">
        {movie.cast.length > 0 ? (
          <CastCarousel cast={movie.cast} heading={castHeading} />
        ) : (
          <>
            {castHeading}
            <p className="text-muted-foreground">Elenco não informado.</p>
          </>
        )}
      </section>

      <Separator />

      <RatingForm movie={detailsToSnapshot(movie)} />
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
  if (query.isPending) return <DetailsSkeleton movieId={movieId} />;
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
