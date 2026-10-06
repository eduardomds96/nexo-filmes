import type { CatalogSearchParams } from '@nexo/contracts';
import { TMDB_MAX_PAGE } from '@nexo/tmdb';

/** Estado do catálogo, guardado na URL (`/filmes?q=&genero=&pagina=`). */
export interface CatalogState {
  readonly query: string;
  readonly genreId: number | null;
  readonly page: number;
}

export const DEFAULT_CATALOG_STATE: CatalogState = { query: '', genreId: null, page: 1 };

/** Busca com menos caracteres que isso não é enviada (evita resultados inúteis). */
export const MIN_QUERY_LENGTH = 2;

const MAX_QUERY_LENGTH = 100;

function parsePositiveInt(value: string | null, max: number): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= max ? parsed : null;
}

/** Lê o estado da URL. Valores inválidos voltam ao padrão em vez de quebrar a página. */
export function parseCatalogParams(params: URLSearchParams): CatalogState {
  const query = (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  return {
    query,
    genreId: parsePositiveInt(params.get('genero'), Number.MAX_SAFE_INTEGER),
    page: parsePositiveInt(params.get('pagina'), TMDB_MAX_PAGE) ?? 1,
  };
}

/** Escreve o estado na URL, omitindo valores padrão para manter links curtos. */
export function toCatalogSearchParams(state: CatalogState): URLSearchParams {
  const record: CatalogSearchParams = {
    ...(state.query.trim() ? { q: state.query.trim() } : {}),
    ...(state.genreId !== null ? { genero: String(state.genreId) } : {}),
    ...(state.page > 1 ? { pagina: String(state.page) } : {}),
  };
  return new URLSearchParams(record as Record<string, string>);
}

export function catalogHref(state: CatalogState): string {
  const search = toCatalogSearchParams(state).toString();
  return search ? `/filmes?${search}` : '/filmes';
}

export function isSearchActive(state: CatalogState): boolean {
  return state.query.length >= MIN_QUERY_LENGTH;
}
