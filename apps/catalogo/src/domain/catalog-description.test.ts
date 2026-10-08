import { APP_DESCRIPTION } from '@nexo/ui';
import { describe, expect, it } from 'vitest';

import { catalogDescription } from './catalog-description';

describe('catalogDescription', () => {
  it('sem filtros usa a descrição geral', () => {
    expect(catalogDescription({ query: '', genreId: null, page: 1 }, null)).toBe(APP_DESCRIPTION);
  });

  it('descreve a busca, com o gênero quando houver', () => {
    expect(catalogDescription({ query: 'duna', genreId: null, page: 1 }, null)).toContain(
      'Resultados da busca por “duna” no Nexo Filmes',
    );
    expect(
      catalogDescription({ query: 'duna', genreId: 878, page: 1 }, 'Ficção científica'),
    ).toContain('“duna” em Ficção científica');
  });

  it('descreve o gênero escolhido', () => {
    expect(catalogDescription({ query: '', genreId: 18, page: 2 }, 'Drama')).toMatch(
      /^Filmes de Drama mais populares/,
    );
  });
});
