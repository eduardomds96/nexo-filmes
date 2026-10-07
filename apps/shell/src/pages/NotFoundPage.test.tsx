import { renderRoute } from '@nexo/testing';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('explica o erro e oferece caminhos de volta', () => {
    renderRoute(<NotFoundPage />, { path: '*', initialEntry: '/nao-existe' });

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Esta cena foi cortada na edição',
    );
    expect(document.title).toBe('Página não encontrada · Nexo Filmes');
    expect(screen.getByRole('link', { name: 'Ir para o catálogo' }).getAttribute('href')).toBe(
      '/filmes',
    );
    expect(screen.getByRole('link', { name: 'Ver meus favoritos' }).getAttribute('href')).toBe(
      '/favoritos',
    );
  });
});
