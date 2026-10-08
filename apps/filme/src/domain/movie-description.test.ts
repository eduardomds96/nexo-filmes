import { describe, expect, it } from 'vitest';

import { movieDescription } from './movie-description';

describe('movieDescription', () => {
  it('usa a sinopse', () => {
    expect(
      movieDescription({ title: 'Clube da Luta', year: 1999, overview: 'Um homem insone.' }),
    ).toBe('Um homem insone.');
  });

  it('encurta sinopses longas no limite de uma palavra', () => {
    const description = movieDescription({
      title: 'X',
      year: 2000,
      overview: 'palavra '.repeat(60),
    });
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/palavra…$/);
  });

  it('sem sinopse, descreve o filme pelo título e ano', () => {
    expect(movieDescription({ title: 'Clube da Luta', year: 1999, overview: '' })).toBe(
      'Clube da Luta (1999): sinopse, elenco, direção e nota da TMDB no Nexo Filmes.',
    );
    expect(movieDescription({ title: 'Sem Data', year: null, overview: '' })).toMatch(/^Sem Data:/);
  });
});
