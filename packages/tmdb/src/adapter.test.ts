import { describe, expect, it } from 'vitest';

import {
  CAST_LIMIT,
  TMDB_MAX_PAGE,
  toGenreLookup,
  toGenres,
  toMovie,
  toMovieDetails,
  toMoviePage,
  toVoteAverage,
  yearFromDate,
} from './adapter';
import { movieDetailsDtoSchema, movieListItemDtoSchema } from './dto';
import { genresFixture, movieDetails, movieListItem } from './testing/fixtures';

const genres = toGenreLookup(toGenres(genresFixture));

function parseListItem(raw: unknown) {
  return movieListItemDtoSchema.parse(raw);
}

function parseDetails(raw: unknown) {
  return movieDetailsDtoSchema.parse(raw);
}

describe('yearFromDate', () => {
  it('extrai o ano de uma data AAAA-MM-DD', () => {
    expect(yearFromDate('1999-10-15')).toBe(1999);
  });

  it.each([null, '', '15/10/1999', '1999'])('devolve null para %j', (value) => {
    expect(yearFromDate(value)).toBeNull();
  });
});

describe('toVoteAverage', () => {
  it('arredonda para uma casa e limita entre 0 e 10', () => {
    expect(toVoteAverage(7.256)).toBe(7.3);
    expect(toVoteAverage(11)).toBe(10);
    expect(toVoteAverage(-1)).toBe(0);
  });

  it('trata ausência ou NaN como 0', () => {
    expect(toVoteAverage(null)).toBe(0);
    expect(toVoteAverage(undefined)).toBe(0);
    expect(toVoteAverage(Number.NaN)).toBe(0);
  });
});

describe('toGenres', () => {
  it('ordena alfabeticamente em pt-BR e descarta itens inválidos', () => {
    const result = toGenres([
      { id: 2, name: 'Ficção' },
      { id: 1, name: 'Ação' },
      { id: 'x', name: 'inválido' },
    ]);
    expect(result).toEqual([
      { id: 1, name: 'Ação' },
      { id: 2, name: 'Ficção' },
    ]);
  });
});

describe('toMovie', () => {
  it('converte um item de lista no tipo de domínio', () => {
    const movie = toMovie(
      parseListItem(
        movieListItem({ id: 550, title: 'Clube da Luta', genre_ids: [18, 28], vote_average: 8.43 }),
      ),
      genres,
    );

    expect(movie).toEqual({
      id: 550,
      title: 'Clube da Luta',
      year: 2020,
      posterUrl: 'https://image.tmdb.org/t/p/w342/poster-550.jpg',
      voteAverage: 8.4,
      voteCount: 1000,
      genres: [
        { id: 18, name: 'Drama' },
        { id: 28, name: 'Ação' },
      ],
    });
  });

  it('sem pôster devolve posterUrl null', () => {
    expect(
      toMovie(parseListItem(movieListItem({ id: 1, poster_path: null })), genres).posterUrl,
    ).toBeNull();
    expect(toMovie(parseListItem({ id: 1, title: 'Sem pôster' }), genres).posterUrl).toBeNull();
  });

  it('tolera campos ausentes', () => {
    const movie = toMovie(parseListItem({ id: 7, title: 'Mínimo' }), genres);
    expect(movie).toEqual({
      id: 7,
      title: 'Mínimo',
      year: null,
      posterUrl: null,
      voteAverage: 0,
      voteCount: 0,
      genres: [],
    });
  });

  it('ignora ids de gênero desconhecidos', () => {
    const movie = toMovie(parseListItem(movieListItem({ id: 1, genre_ids: [99999, 35] })), genres);
    expect(movie.genres).toEqual([{ id: 35, name: 'Comédia' }]);
  });
});

describe('toMoviePage', () => {
  it('descarta itens inválidos sem derrubar a página', () => {
    const page = toMoviePage(
      {
        page: 2,
        total_pages: 4,
        total_results: 80,
        results: [movieListItem({ id: 1 }), { id: 'quebrado' }, { title: 'sem id' }],
      },
      genres,
    );
    expect(page.page).toBe(2);
    expect(page.totalPages).toBe(4);
    expect(page.totalResults).toBe(80);
    expect(page.items.map((m) => m.id)).toEqual([1]);
  });

  it(`limita o total de páginas a ${String(TMDB_MAX_PAGE)}`, () => {
    const page = toMoviePage(
      { page: 1, total_pages: 40_000, total_results: 1, results: [] },
      genres,
    );
    expect(page.totalPages).toBe(TMDB_MAX_PAGE);
  });
});

describe('toMovieDetails', () => {
  it('converte o detalhe com direção e elenco', () => {
    const details = toMovieDetails(parseDetails(movieDetails({ id: 550 })));

    expect(details).toMatchObject({
      id: 550,
      title: 'Filme 550',
      year: 1999,
      runtimeMinutes: 139,
      voteAverage: 8.4,
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster-550.jpg',
      posterThumbUrl: 'https://image.tmdb.org/t/p/w342/poster-550.jpg',
      genres: [{ id: 18, name: 'Drama' }],
      directors: [{ id: 7467, name: 'David Fincher' }],
    });
    expect(details.cast[0]).toEqual({
      id: 819,
      name: 'Edward Norton',
      character: 'Narrador',
      profileUrl: 'https://image.tmdb.org/t/p/w185/norton.jpg',
    });
  });

  it('sem diretor devolve lista vazia', () => {
    const details = toMovieDetails(
      parseDetails(
        movieDetails({ id: 1, credits: { cast: [], crew: [{ id: 2, name: 'X', job: 'Writer' }] } }),
      ),
    );
    expect(details.directors).toEqual([]);
  });

  it('não repete o mesmo diretor e aceita mais de um', () => {
    const details = toMovieDetails(
      parseDetails(
        movieDetails({
          id: 1,
          credits: {
            crew: [
              { id: 10, name: 'Lana', job: 'Director' },
              { id: 10, name: 'Lana', job: 'Director' },
              { id: 11, name: 'Lilly', job: 'Director' },
            ],
          },
        }),
      ),
    );
    expect(details.directors.map((d) => d.name)).toEqual(['Lana', 'Lilly']);
    expect(details.cast).toEqual([]);
  });

  it('sem créditos, pôster, duração ou sinopse usa valores neutros', () => {
    const details = toMovieDetails(parseDetails({ id: 3, title: 'Só título' }));
    expect(details).toEqual({
      id: 3,
      title: 'Só título',
      year: null,
      posterUrl: null,
      posterThumbUrl: null,
      voteAverage: 0,
      voteCount: 0,
      runtimeMinutes: null,
      overview: '',
      tagline: null,
      genres: [],
      directors: [],
      cast: [],
    });
  });

  it('duração 0 vira null e personagem vazio vira null', () => {
    const details = toMovieDetails(
      parseDetails(
        movieDetails({
          id: 1,
          runtime: 0,
          credits: { cast: [{ id: 1, name: 'Ator', character: '  ', profile_path: null }] },
        }),
      ),
    );
    expect(details.runtimeMinutes).toBeNull();
    expect(details.cast[0]).toEqual({ id: 1, name: 'Ator', character: null, profileUrl: null });
  });

  it(`ordena o elenco pela ordem de créditos e limita a ${String(CAST_LIMIT)} pessoas`, () => {
    const cast = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Pessoa ${String(i + 1)}`,
      character: 'Papel',
      order: 19 - i,
    }));
    const details = toMovieDetails(parseDetails(movieDetails({ id: 1, credits: { cast } })));
    expect(details.cast).toHaveLength(CAST_LIMIT);
    expect(details.cast[0]?.name).toBe('Pessoa 20');
  });
});
