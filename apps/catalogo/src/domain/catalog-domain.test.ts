import type { Movie, Page } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';

import {
  catalogHref,
  isSearchActive,
  parseCatalogParams,
  toCatalogSearchParams,
} from './catalog-params';
import { filterPageByGenre, toCatalogRequest, toSnapshot } from './catalog-request';
import { resultsSummary } from './results-summary';

const params = (query: string) => parseCatalogParams(new URLSearchParams(query));

function movie(id: number, genreIds: number[]): Movie {
  return {
    id,
    title: `Filme ${String(id)}`,
    year: 2000,
    posterUrl: null,
    voteAverage: 7,
    voteCount: 10,
    genres: genreIds.map((g) => ({ id: g, name: `Gênero ${String(g)}` })),
  };
}

function page(items: Movie[], totalResults = items.length): Page<Movie> {
  return { page: 1, totalPages: 3, totalResults, items };
}

describe('estado do catálogo na URL', () => {
  it('lê q, genero e pagina', () => {
    expect(params('q=matrix&genero=28&pagina=3')).toEqual({
      query: 'matrix',
      genreId: 28,
      page: 3,
    });
  });

  it('usa padrões para valores ausentes ou inválidos', () => {
    expect(params('')).toEqual({ query: '', genreId: null, page: 1 });
    expect(params('genero=abc&pagina=-2')).toEqual({ query: '', genreId: null, page: 1 });
    expect(params('pagina=0')).toMatchObject({ page: 1 });
    expect(params('pagina=2.5')).toMatchObject({ page: 1 });
    expect(params('pagina=501')).toMatchObject({ page: 1 });
  });

  it('remove espaços e limita o tamanho da busca', () => {
    expect(params('q=%20%20duna%20').query).toBe('duna');
    expect(params(`q=${'a'.repeat(300)}`).query).toHaveLength(100);
  });

  it('escreve só o que não é padrão', () => {
    expect(toCatalogSearchParams({ query: '', genreId: null, page: 1 }).toString()).toBe('');
    expect(toCatalogSearchParams({ query: ' duna ', genreId: 878, page: 2 }).toString()).toBe(
      'q=duna&genero=878&pagina=2',
    );
  });

  it('ida e volta preserva o estado', () => {
    const state = { query: 'cidade de deus', genreId: 18, page: 4 };
    expect(parseCatalogParams(toCatalogSearchParams(state))).toEqual(state);
  });

  it('monta o href do catálogo', () => {
    expect(catalogHref({ query: '', genreId: null, page: 1 })).toBe('/filmes');
    expect(catalogHref({ query: 'x y', genreId: null, page: 2 })).toBe('/filmes?q=x+y&pagina=2');
  });

  it('busca só fica ativa a partir de 2 letras', () => {
    expect(isSearchActive({ query: 'a', genreId: null, page: 1 })).toBe(false);
    expect(isSearchActive({ query: 'ab', genreId: null, page: 1 })).toBe(true);
  });
});

describe('requisição do catálogo', () => {
  it('sem busca usa discover com o gênero no servidor', () => {
    expect(toCatalogRequest({ query: '', genreId: 28, page: 2 })).toEqual({
      kind: 'discover',
      page: 2,
      genreId: 28,
    });
  });

  it('com busca usa search e leva o gênero para o filtro local', () => {
    expect(toCatalogRequest({ query: 'duna', genreId: 878, page: 1 })).toEqual({
      kind: 'search',
      query: 'duna',
      page: 1,
      genreId: 878,
    });
  });

  it('busca de 1 letra continua no discover', () => {
    expect(toCatalogRequest({ query: 'd', genreId: null, page: 1 }).kind).toBe('discover');
  });
});

describe('filtro de gênero sobre a busca', () => {
  it('mantém só os filmes do gênero e conta os escondidos', () => {
    const result = filterPageByGenre(
      page([movie(1, [28]), movie(2, [18]), movie(3, [18, 28])]),
      28,
    );
    expect(result.items.map((m) => m.id)).toEqual([1, 3]);
    expect(result.hiddenByGenre).toBe(1);
    expect(result.genreFilteredLocally).toBe(true);
    // A paginação continua sendo a da busca.
    expect(result.totalPages).toBe(3);
  });

  it('sem gênero devolve a página intacta', () => {
    const result = filterPageByGenre(page([movie(1, [28])]), null);
    expect(result).toMatchObject({ hiddenByGenre: 0, genreFilteredLocally: false });
    expect(result.items).toHaveLength(1);
  });
});

describe('resumo anunciado', () => {
  it('conta os filmes encontrados', () => {
    const base = { hiddenByGenre: 0, genreFilteredLocally: false };
    expect(resultsSummary({ ...page([movie(1, [])], 20), ...base }, null)).toBe(
      '20 filmes encontrados.',
    );
    expect(resultsSummary({ ...page([movie(1, [])], 1), ...base }, null)).toBe(
      '1 filme encontrado.',
    );
  });

  it('explica o filtro local de gênero', () => {
    const result = filterPageByGenre(page([movie(1, [28]), movie(2, [18])], 40), 28);
    expect(resultsSummary(result, 'Ação')).toBe(
      '1 filme de Ação nesta página da busca (40 resultados no total).',
    );
  });
});

describe('snapshot do favorito', () => {
  it('guarda só id, título, ano, pôster e gêneros', () => {
    expect(toSnapshot({ ...movie(9, [18]), voteAverage: 9.9 })).toEqual({
      id: 9,
      title: 'Filme 9',
      year: 2000,
      posterUrl: null,
      genres: [{ id: 18, name: 'Gênero 18' }],
    });
  });
});
