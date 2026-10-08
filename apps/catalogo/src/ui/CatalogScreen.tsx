import { isTmdbError } from '@nexo/tmdb';
import {
  Button,
  EmptyState,
  ErrorState,
  MovieCardSkeleton,
  MovieGrid,
  PageHeading,
  Pagination,
} from '@nexo/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import {
  catalogHref,
  isSearchActive,
  MIN_QUERY_LENGTH,
  parseCatalogParams,
  toCatalogSearchParams,
} from '../domain/catalog-params';
import type { CatalogState } from '../domain/catalog-params';
import { catalogDescription } from '../domain/catalog-description';
import { catalogQueryKey, fetchCatalog, toCatalogRequest } from '../domain/catalog-request';
import { resultsSummary } from '../domain/results-summary';
import { SEARCH_DEBOUNCE_MS, useDebouncedCallback } from '../domain/use-debounced-callback';
import { getTmdbClient } from '../services/tmdb';
import { CatalogFilters } from './CatalogFilters';
import { CatalogMovieCard } from './CatalogMovieCard';
import { RouterLink } from './RouterLink';

function errorCopy(error: unknown) {
  if (isTmdbError(error) && error.kind === 'rate-limit') {
    return { title: 'Muitas requisições', message: error.message };
  }
  return {
    title: 'Não foi possível carregar os filmes',
    message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
  };
}

export function CatalogScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseCatalogParams(searchParams);
  const tmdb = getTmdbClient();

  // Texto do campo de busca: muda a cada tecla; a URL só muda após a pausa.
  const [text, setText] = useState(state.query);
  const [syncedQuery, setSyncedQuery] = useState(state.query);
  if (state.query !== syncedQuery) {
    // A URL mudou por fora (voltar/avançar): o campo acompanha.
    setSyncedQuery(state.query);
    if (text.trim() !== state.query) setText(state.query);
  }

  const navigate = (next: CatalogState, replace = false) => {
    setSearchParams(toCatalogSearchParams(next), { replace });
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const query = value.trim();
    if (query === state.query) return;
    // Digitar não deve encher o histórico: substitui a entrada atual.
    navigate({ ...state, query, page: 1 }, true);
  }, SEARCH_DEBOUNCE_MS);

  const genresQuery = useQuery({
    queryKey: ['tmdb', 'genres'],
    queryFn: () => tmdb.getGenres(),
    staleTime: Infinity,
  });

  const request = toCatalogRequest(state);
  const results = useQuery({
    queryKey: catalogQueryKey(request),
    queryFn: ({ signal }) => fetchCatalog(tmdb, request, signal),
    placeholderData: keepPreviousData,
  });

  // Ao trocar de página, leva o foco e a rolagem para o início dos resultados.
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(state.page);
  useEffect(() => {
    if (previousPage.current !== state.page) {
      previousPage.current = state.page;
      resultsHeading.current?.focus();
      resultsHeading.current?.scrollIntoView({ block: 'start' });
    }
  }, [state.page]);

  const genres = genresQuery.data ?? [];
  const genreName = genres.find((g) => g.id === state.genreId)?.name ?? null;
  const data = results.data;
  const isTyping = text.trim() !== state.query && text.trim().length >= MIN_QUERY_LENGTH;
  const isRefreshing = results.isFetching && results.isPlaceholderData;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        documentTitle={state.query ? `Busca: ${state.query}` : 'Filmes'}
        description={catalogDescription(state, genreName)}
      >
        Filmes
      </PageHeading>

      <CatalogFilters
        text={text}
        onTextChange={(value) => {
          setText(value);
          debouncedSearch.run(value);
        }}
        genreId={state.genreId}
        onGenreChange={(genreId) => {
          debouncedSearch.cancel();
          navigate({ query: text.trim(), genreId, page: 1 });
        }}
        genres={genres}
        genresStatus={genresQuery.status}
        isSearching={isTyping || isRefreshing}
      />

      {isSearchActive(state) && state.genreId !== null && (
        <p
          className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm"
          id="aviso-busca-genero"
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            A busca por título da TMDB não filtra por gênero. Mostramos só os filmes
            {genreName ? ` de ${genreName}` : ' do gênero escolhido'} dentro de cada página da
            busca, e a paginação segue a busca.
          </span>
        </p>
      )}

      <section
        aria-labelledby="resultados"
        aria-busy={results.isFetching}
        className="flex flex-col gap-4"
      >
        <h2 id="resultados" ref={resultsHeading} tabIndex={-1} className="sr-only">
          Resultados
        </h2>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {data && !results.isError ? resultsSummary(data, genreName) : ''}
        </p>

        {results.isPending ? (
          <MovieGrid>
            {Array.from({ length: 10 }, (_, index) => (
              <li key={index}>
                <MovieCardSkeleton />
              </li>
            ))}
          </MovieGrid>
        ) : results.isError ? (
          <ErrorState
            {...errorCopy(results.error)}
            isRetrying={results.isFetching}
            onRetry={() => void results.refetch()}
          />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="Nenhum filme encontrado"
            description={
              data.genreFilteredLocally && data.hiddenByGenre > 0
                ? 'Nenhum filme desta página da busca é do gênero escolhido. Tente a próxima página ou outro gênero.'
                : 'Tente outro título ou remova o filtro de gênero.'
            }
            action={
              <Button
                variant="outline"
                onClick={() => {
                  debouncedSearch.cancel();
                  setText('');
                  navigate({ query: '', genreId: null, page: 1 });
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        ) : data ? (
          <MovieGrid className={isRefreshing ? 'opacity-60 transition-opacity' : undefined}>
            {data.items.map((movie, index) => (
              <li key={movie.id}>
                <CatalogMovieCard movie={movie} priority={index < 4} />
              </li>
            ))}
          </MovieGrid>
        ) : null}

        {data && !results.isError && (
          <Pagination
            page={state.page}
            totalPages={data.totalPages}
            hrefFor={(page) => catalogHref({ ...state, page })}
            LinkComponent={RouterLink}
          />
        )}
      </section>
    </div>
  );
}
