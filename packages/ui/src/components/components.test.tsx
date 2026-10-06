import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FavoriteButton } from './favorite-button';
import { MoviePoster } from './movie-poster';
import { PageHeading } from './page-heading';
import { visiblePages } from './pagination';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset['nexoBooted'];
});

function ControlledFavorite({ outcome }: { outcome: 'commit' | 'revert' }) {
  const [state, setState] = useState({ isFavorite: false, isPending: false });
  return (
    <>
      <FavoriteButton
        title="Matrix"
        isFavorite={state.isFavorite}
        isPending={state.isPending}
        onToggle={() => {
          setState({ isFavorite: true, isPending: true });
        }}
      />
      <button
        type="button"
        onClick={() => {
          setState({ isFavorite: outcome === 'commit', isPending: false });
        }}
      >
        concluir
      </button>
    </>
  );
}

describe('FavoriteButton', () => {
  it('usa aria-pressed e rótulo dinâmico', () => {
    const { rerender } = render(
      <FavoriteButton title="Matrix" isFavorite={false} isPending={false} onToggle={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: 'Adicionar Matrix aos favoritos' });
    expect(button.getAttribute('aria-pressed')).toBe('false');

    rerender(<FavoriteButton title="Matrix" isFavorite isPending={false} onToggle={vi.fn()} />);
    expect(
      screen
        .getByRole('button', { name: 'Remover Matrix dos favoritos' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('enquanto salva fica aria-busy, aria-disabled, anuncia e ignora cliques', async () => {
    const onToggle = vi.fn();
    render(<FavoriteButton title="Matrix" isFavorite isPending onToggle={onToggle} />);
    const button = screen.getByRole('button');

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Salvando Matrix…');

    await userEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('anuncia sucesso depois de salvar', async () => {
    render(<ControlledFavorite outcome="commit" />);
    await userEvent.click(screen.getByRole('button', { name: /Adicionar Matrix/ }));
    await userEvent.click(screen.getByRole('button', { name: 'concluir' }));
    expect(screen.getByRole('status').textContent).toBe('Matrix adicionado aos favoritos.');
  });

  it('anuncia que voltou ao estado anterior quando falha', async () => {
    render(<ControlledFavorite outcome="revert" />);
    await userEvent.click(screen.getByRole('button', { name: /Adicionar Matrix/ }));
    await userEvent.click(screen.getByRole('button', { name: 'concluir' }));
    expect(screen.getByRole('status').textContent).toContain('voltou ao estado anterior');
    expect(screen.getByRole('button', { name: /Adicionar Matrix/ })).toBeDefined();
  });
});

describe('MoviePoster', () => {
  it('renderiza a imagem com alt, lazy e dimensões fixas', () => {
    render(<MoviePoster src="https://img/x.jpg" title="Matrix" />);
    const img = screen.getByRole('img', { name: 'Pôster do filme Matrix' });
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('width')).toBe('342');
    expect(img.getAttribute('height')).toBe('513');
  });

  it('sem pôster mostra placeholder acessível', () => {
    render(<MoviePoster src={null} title="Matrix" />);
    expect(screen.getByRole('img', { name: 'Pôster indisponível: Matrix' })).toBeDefined();
  });

  it('se a imagem falhar, troca pelo placeholder', () => {
    render(<MoviePoster src="https://img/quebrada.jpg" title="Matrix" size="detail" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img', { name: 'Pôster indisponível: Matrix' })).toBeDefined();
  });
});

describe('PageHeading', () => {
  it('atualiza document.title', () => {
    render(<PageHeading documentTitle="Favoritos">Seus favoritos</PageHeading>);
    expect(document.title).toBe('Favoritos · Nexo Filmes');
  });

  it('não rouba o foco na carga inicial, mas foca o h1 nas navegações seguintes', () => {
    const { unmount } = render(<PageHeading documentTitle="A">Primeira</PageHeading>);
    expect(document.activeElement).not.toBe(screen.getByRole('heading'));
    unmount();

    render(<PageHeading documentTitle="B">Segunda</PageHeading>);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Segunda' }));
  });
});

describe('visiblePages', () => {
  it('mostra primeira, última e vizinhas, com saltos', () => {
    expect(visiblePages(1, 1)).toEqual([1]);
    expect(visiblePages(1, 10)).toEqual([1, 2, null, 10]);
    expect(visiblePages(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(visiblePages(10, 10)).toEqual([1, null, 9, 10]);
    expect(visiblePages(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});
