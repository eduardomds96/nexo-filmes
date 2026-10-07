/**
 * Rotas de topo, das quais o Shell é dono. Os micro-frontends se comunicam
 * por URL: estes tipos garantem que todos montem os mesmos caminhos.
 */
export type AppRoute =
  | '/'
  | '/filmes'
  | `/filmes?${string}`
  | `/filme/${number}`
  | '/favoritos'
  | '/avaliacoes'
  | `/avaliacoes?${string}`
  | '/painel';

/** Query string do catálogo (`/filmes?q=&genero=&pagina=`). */
export interface CatalogSearchParams {
  readonly q?: string;
  /** Id do gênero na TMDB. */
  readonly genero?: string;
  readonly pagina?: string;
}
