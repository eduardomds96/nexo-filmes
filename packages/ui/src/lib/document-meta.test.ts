import { afterEach, describe, expect, it } from 'vitest';

import { setMetaDescription, setNoIndex, toMetaDescription } from './document-meta';

const meta = (name: string) => document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

afterEach(() => {
  document.head.innerHTML = '';
});

describe('toMetaDescription', () => {
  it('mantém textos curtos e normaliza espaços', () => {
    expect(toMetaDescription('  Um   filme\nincrível. ')).toBe('Um filme incrível.');
  });

  it('corta no limite de uma palavra, sem pontuação solta, com reticências', () => {
    const result = toMetaDescription('uma frase, '.repeat(30), 50);
    expect(result).toBe('uma frase, uma frase, uma frase, uma frase, uma…');
    expect(result.length).toBeLessThanOrEqual(50);
    expect(toMetaDescription('abc, def, ghi', 10)).toBe('abc, def…');
  });
});

describe('meta tags', () => {
  it('cria e atualiza a descrição', () => {
    setMetaDescription('Primeira');
    setMetaDescription('Segunda');
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(meta('description')?.content).toBe('Segunda');
  });

  it('liga e desliga o noindex', () => {
    setNoIndex(true);
    expect(meta('robots')?.content).toBe('noindex');
    setNoIndex(false);
    expect(meta('robots')).toBeNull();
  });
});
