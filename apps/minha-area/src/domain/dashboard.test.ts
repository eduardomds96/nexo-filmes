import type { FavoriteMovie, Rating } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';

import {
  averageScore,
  computeDashboard,
  formatAverage,
  genreChartData,
  genreCounts,
  mostFrequentGenre,
  withUserScores,
} from './dashboard';

function favorite(id: number, genres: string[]): FavoriteMovie {
  return {
    id,
    title: `Filme ${String(id)}`,
    year: 2000,
    posterUrl: null,
    genres: genres.map((name, index) => ({ id: index + 1, name })),
    favoritedAt: '2026-01-01T00:00:00.000Z',
  };
}

function rating(movieId: number, score: number): Rating {
  return {
    movieId,
    score,
    comment: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    movie: null,
  };
}

describe('nota média', () => {
  it('formata com 1 casa decimal no padrão pt-BR', () => {
    expect(formatAverage(7.5)).toBe('7,5');
    expect(formatAverage(8)).toBe('8,0');
    expect(formatAverage(7.25)).toBe('7,3');
    expect(formatAverage(10)).toBe('10,0');
  });

  it('calcula a média das avaliações', () => {
    expect(averageScore([rating(1, 7), rating(2, 8)])).toBe(7.5);
    expect(formatAverage(averageScore([rating(1, 6.5), rating(2, 7), rating(3, 9)]) ?? 0)).toBe(
      '7,5',
    );
  });

  it('sem avaliações é null', () => {
    expect(averageScore([])).toBeNull();
  });
});

describe('gênero mais frequente', () => {
  it('conta os gêneros dos favoritos', () => {
    expect(
      mostFrequentGenre([
        favorite(1, ['Drama', 'Crime']),
        favorite(2, ['Drama']),
        favorite(3, ['Ação']),
      ]),
    ).toEqual({ name: 'Drama', count: 2 });
  });

  it('desempata em ordem alfabética pt-BR', () => {
    expect(mostFrequentGenre([favorite(1, ['Drama']), favorite(2, ['Ação'])])).toEqual({
      name: 'Ação',
      count: 1,
    });
    // "Ação" < "Animação" < "Aventura" com localeCompare('pt-BR'), não pela tabela Unicode.
    expect(
      mostFrequentGenre([
        favorite(1, ['Aventura']),
        favorite(2, ['Animação']),
        favorite(3, ['Ação']),
      ])?.name,
    ).toBe('Ação');
    expect(mostFrequentGenre([favorite(1, ['Ética']), favorite(2, ['Faroeste'])])?.name).toBe(
      'Ética',
    );
  });

  it('o desempate não depende da ordem dos favoritos', () => {
    const a = favorite(1, ['Terror']);
    const b = favorite(2, ['Comédia']);
    expect(mostFrequentGenre([a, b])?.name).toBe('Comédia');
    expect(mostFrequentGenre([b, a])?.name).toBe('Comédia');
  });

  it('um gênero repetido no mesmo filme conta uma vez', () => {
    expect(mostFrequentGenre([favorite(1, ['Drama', 'Drama']), favorite(2, ['Crime'])])).toEqual({
      name: 'Crime',
      count: 1,
    });
  });

  it('sem favoritos ou sem gêneros é null', () => {
    expect(mostFrequentGenre([])).toBeNull();
    expect(mostFrequentGenre([favorite(1, [])])).toBeNull();
  });
});

describe('gêneros do gráfico', () => {
  it('conta todos os gêneros, do mais frequente ao menos, com desempate alfabético', () => {
    expect(
      genreCounts([
        favorite(1, ['Drama', 'Crime']),
        favorite(2, ['Ação', 'Drama', 'Drama']),
        favorite(3, ['Crime', 'Ação']),
      ]),
    ).toEqual([
      { name: 'Ação', count: 2 },
      { name: 'Crime', count: 2 },
      { name: 'Drama', count: 2 },
    ]);
    expect(genreCounts([])).toEqual([]);
  });

  it('mantém os mais frequentes e soma o resto em "Outros"', () => {
    const counts = [5, 4, 3, 2, 1].map((count, index) => ({ name: `G${String(index)}`, count }));
    expect(genreChartData(counts, 5)).toEqual(counts);
    expect(genreChartData(counts, 3)).toEqual([
      { name: 'G0', count: 5 },
      { name: 'G1', count: 4 },
      { name: 'Outros', count: 6 },
    ]);
  });
});

describe('computeDashboard', () => {
  it('reúne totais, média e gênero', () => {
    expect(
      computeDashboard(
        [favorite(1, ['Drama']), favorite(2, ['Drama', 'Ação'])],
        [rating(1, 7), rating(9, 8)],
      ),
    ).toEqual({
      totalFavorites: 2,
      totalRated: 2,
      averageScore: 7.5,
      topGenre: { name: 'Drama', count: 2 },
      genres: [
        { name: 'Drama', count: 2 },
        { name: 'Ação', count: 1 },
      ],
    });
  });
});

describe('withUserScores', () => {
  it('junta a nota do usuário a cada favorito', () => {
    const result = withUserScores(
      [favorite(1, []), favorite(2, [])],
      new Map([[2, rating(2, 9.5)]]),
    );
    expect(result.map((f) => f.userScore)).toEqual([null, 9.5]);
  });
});
