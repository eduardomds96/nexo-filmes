import type { Genre } from '@nexo/contracts';
import { cn, Input, Label, ScrollRow, Skeleton, Spinner } from '@nexo/ui';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

import { MIN_QUERY_LENGTH } from '../domain/catalog-params';

export interface CatalogFiltersProps {
  readonly text: string;
  readonly onTextChange: (value: string) => void;
  readonly genreId: number | null;
  readonly onGenreChange: (genreId: number | null) => void;
  readonly genres: readonly Genre[];
  readonly genresStatus: 'pending' | 'error' | 'success';
  readonly isSearching: boolean;
}

function GenreChip({
  value,
  checked,
  onSelect,
  children,
}: {
  value: number | null;
  checked: boolean;
  onSelect: (genreId: number | null) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative shrink-0 snap-start" data-checked={checked || undefined}>
      <input
        type="radio"
        name="genero"
        value={value === null ? '' : String(value)}
        checked={checked}
        onChange={() => {
          onSelect(value);
        }}
        className="peer sr-only"
      />
      <span className="inline-flex h-9 cursor-pointer items-center rounded-full border bg-card px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:border-input hover:text-foreground peer-checked:hover:text-primary-foreground">
        {children}
      </span>
    </label>
  );
}

/**
 * Barra de filtros fixa no topo (abaixo do cabeçalho): busca por título e
 * gêneros como chips roláveis. Os chips são um grupo de rádios nativo, então
 * as setas do teclado trocam o gênero, como num select.
 */
export function CatalogFilters({
  text,
  onTextChange,
  genreId,
  onGenreChange,
  genres,
  genresStatus,
  isSearching,
}: CatalogFiltersProps) {
  const chipsRef = useRef<HTMLDivElement>(null);
  const tooShort = text.trim().length > 0 && text.trim().length < MIN_QUERY_LENGTH;
  const unknownGenre = genreId !== null && !genres.some((g) => g.id === genreId);

  // Mantém o chip escolhido visível na faixa rolável (ex.: ao abrir com ?genero=).
  useEffect(() => {
    const scroller = chipsRef.current;
    const chip = scroller?.querySelector<HTMLElement>('[data-checked]');
    if (!scroller || !chip) return;
    const left = chip.offsetLeft - scroller.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = left - 16;
    }
  }, [genreId, genres.length]);

  return (
    <form
      role="search"
      aria-label="Filtrar filmes"
      className="sticky top-header z-30 -mx-gutter flex flex-col gap-3 border-b border-border/60 bg-background/80 px-gutter py-3 backdrop-blur-xl backdrop-saturate-150"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="busca-titulo" className="sr-only">
          Buscar por título
        </Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="busca-titulo"
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="Buscar por título, ex.: Cidade de Deus"
            className="h-11 rounded-full pr-10 pl-10"
            value={text}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onTextChange(event.target.value);
            }}
            aria-describedby="busca-dica"
          />
          {isSearching && (
            <Spinner className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>
        {/* Visível só quando ajuda: com 1 letra digitada. */}
        <p
          id="busca-dica"
          className={cn('px-4 text-sm text-muted-foreground', !tooShort && 'sr-only')}
        >
          A busca começa a partir de {MIN_QUERY_LENGTH} letras.
        </p>
      </div>

      <fieldset className="min-w-0">
        <legend className="sr-only">Gênero</legend>
        <ScrollRow
          scrollerRef={chipsRef}
          hint
          previousLabel="Gêneros anteriores"
          nextLabel="Mais gêneros"
          scrollerClassName="-mx-gutter snap-x scroll-px-gutter gap-2 px-gutter py-1"
        >
          <GenreChip value={null} checked={genreId === null} onSelect={onGenreChange}>
            Todos
          </GenreChip>
          {genres.map((genre) => (
            <GenreChip
              key={genre.id}
              value={genre.id}
              checked={genreId === genre.id}
              onSelect={onGenreChange}
            >
              {genre.name}
            </GenreChip>
          ))}
          {unknownGenre && (
            <GenreChip value={genreId} checked onSelect={onGenreChange}>
              Gênero {genreId}
            </GenreChip>
          )}
          {genresStatus === 'pending' &&
            Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
            ))}
        </ScrollRow>
        {genresStatus === 'error' && (
          <p className="text-sm text-destructive">Não foi possível carregar os gêneros.</p>
        )}
      </fieldset>
    </form>
  );
}
