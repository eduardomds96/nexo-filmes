import { describe, expect, it } from 'vitest';

import { demoImageSvg } from './demo-data';

describe('imagens de demonstração', () => {
  it('escolhe pôster, fundo ou foto pelo nome do arquivo', () => {
    expect(demoImageSvg('598.svg')).toContain('Cidade de Deus');
    expect(demoImageSvg('598.svg')).toContain('viewBox="0 0 500 750"');
    expect(demoImageSvg('backdrop-598.svg')).toContain('viewBox="0 0 1280 720"');
    expect(demoImageSvg('profile-5980.svg')).toContain('viewBox="0 0 185 278"');
  });
});
