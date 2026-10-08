import { describe, expect, it } from 'vitest';

import { tmdbImageUrl, tmdbPosterSrcSet } from './images';

describe('tmdbPosterSrcSet', () => {
  it('oferece o mesmo pôster em 185, 342 e 500 px', () => {
    expect(tmdbPosterSrcSet('https://image.tmdb.org/t/p/w342/abc.jpg')).toBe(
      'https://image.tmdb.org/t/p/w185/abc.jpg 185w, ' +
        'https://image.tmdb.org/t/p/w342/abc.jpg 342w, ' +
        'https://image.tmdb.org/t/p/w500/abc.jpg 500w',
    );
  });

  it('funciona a partir de qualquer tamanho, inclusive com subpasta', () => {
    expect(tmdbPosterSrcSet(tmdbImageUrl('/demo/598.svg', 'w500'))).toContain(
      'https://image.tmdb.org/t/p/w185/demo/598.svg 185w',
    );
  });

  it('não gera srcset sem pôster ou para outras origens', () => {
    expect(tmdbPosterSrcSet(null)).toBeUndefined();
    expect(tmdbPosterSrcSet('https://exemplo.com/w342/abc.jpg')).toBeUndefined();
    expect(tmdbPosterSrcSet('https://image.tmdb.org/t/p/original/abc.jpg')).toBeUndefined();
  });
});
