import type { Genre } from '@nexo/contracts';
import { Input, Label, NativeSelect, Spinner } from '@nexo/ui';
import { Search } from 'lucide-react';
import type { ChangeEvent } from 'react';

export interface CatalogFiltersProps {
  readonly text: string;
  readonly onTextChange: (value: string) => void;
  readonly genreId: number | null;
  readonly onGenreChange: (genreId: number | null) => void;
  readonly genres: readonly Genre[];
  readonly genresStatus: 'pending' | 'error' | 'success';
  readonly isSearching: boolean;
}

export function CatalogFilters({
  text,
  onTextChange,
  genreId,
  onGenreChange,
  genres,
  genresStatus,
  isSearching,
}: CatalogFiltersProps) {
  return (
    <form
      role="search"
      aria-label="Filtrar filmes"
      className="grid gap-4 sm:grid-cols-[1fr_16rem]"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="busca-titulo">Buscar por título</Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="busca-titulo"
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="Ex.: Cidade de Deus"
            className="pl-9"
            value={text}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onTextChange(event.target.value);
            }}
            aria-describedby="busca-dica"
          />
          {isSearching && (
            <Spinner className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>
        <p id="busca-dica" className="text-sm text-muted-foreground">
          A busca começa a partir de 2 letras.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="filtro-genero">Gênero</Label>
        <NativeSelect
          id="filtro-genero"
          value={genreId === null ? '' : String(genreId)}
          disabled={genresStatus === 'pending' && genreId === null}
          onChange={(event) => {
            const value = event.target.value;
            onGenreChange(value === '' ? null : Number(value));
          }}
        >
          <option value="">Todos os gêneros</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
          {genreId !== null && !genres.some((g) => g.id === genreId) && (
            <option value={genreId}>Gênero {genreId}</option>
          )}
        </NativeSelect>
        {genresStatus === 'error' && (
          <p className="text-sm text-destructive">Não foi possível carregar os gêneros.</p>
        )}
      </div>
    </form>
  );
}
