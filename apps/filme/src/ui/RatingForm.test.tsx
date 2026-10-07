import { renderRoute } from '@nexo/testing';
import { ratingMessages } from '@nexo/user-data';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RatingForm } from './RatingForm';

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

function renderForm(movieId = 550, options = {}, hashEntry = '/') {
  const movie = {
    id: movieId,
    title: 'Clube da Luta',
    year: 1999,
    posterUrl: null,
    genres: [{ id: 18, name: 'Drama' }],
  };
  const utils = renderRoute(<RatingForm movie={movie} />, {
    path: '/',
    initialEntry: hashEntry,
    ...options,
  });
  return {
    ...utils,
    score: () => screen.getByRole('radiogroup', { name: 'Nota' }),
    checkedScore: () =>
      screen.queryByRole('radio', { checked: true })?.getAttribute('aria-label') ?? null,
    choose: (user: ReturnType<typeof userEvent.setup>, value: string) =>
      user.click(screen.getByRole('radio', { name: `${value} de 10` })),
    comment: () => screen.getByLabelText<HTMLTextAreaElement>(/Comentário/),
    submit: () => screen.getByRole('button', { name: /avaliação$/ }),
  };
}

describe('RatingForm', () => {
  it('mostra a mensagem de cada campo, foca o primeiro inválido e preserva o que foi digitado', async () => {
    const user = userEvent.setup();
    const { score, comment, submit } = renderForm();
    const longComment = 'a'.repeat(501);

    await user.click(comment());
    await user.paste(longComment);
    await user.click(submit());

    expect(await screen.findByText(ratingMessages.scoreRequired)).toBeDefined();
    expect(screen.getByText(ratingMessages.commentTooLong)).toBeDefined();
    // O foco vai para o rádio que recebe Tab no grupo de estrelas (sem nota, o primeiro).
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '0,5 de 10' }));
    expect(score().contains(document.activeElement)).toBe(true);
    expect(score().getAttribute('aria-invalid')).toBe('true');
    expect(comment().value).toBe(longComment);
  });

  it('com só o comentário inválido, o foco vai para o comentário e a nota fica', async () => {
    const user = userEvent.setup();
    const { comment, submit, choose, checkedScore } = renderForm();

    await choose(user, '8');
    await user.click(comment());
    await user.paste('b'.repeat(501));
    await user.click(submit());

    expect(await screen.findByText(ratingMessages.commentTooLong)).toBeDefined();
    await waitFor(() => {
      expect(document.activeElement).toBe(comment());
    });
    expect(checkedScore()).toBe('8 de 10');
  });

  it('escolhe a nota pelo teclado, em meias estrelas', async () => {
    const user = userEvent.setup();
    const { store, submit, checkedScore } = renderForm();
    const first = screen.getByRole('radio', { name: '0,5 de 10' });

    expect(screen.getAllByRole('radio').filter((r) => r.tabIndex === 0)).toEqual([first]);
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(checkedScore()).toBe('0,5 de 10');
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowUp}');
    expect(checkedScore()).toBe('2 de 10');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '2 de 10' }));
    await user.keyboard('{End}');
    expect(checkedScore()).toBe('10 de 10');
    await user.keyboard('{ArrowRight}{ArrowLeft}{ArrowDown}');
    expect(checkedScore()).toBe('9 de 10');
    await user.keyboard('{Home}');
    expect(checkedScore()).toBe('0,5 de 10');
    await user.keyboard('{End}{ArrowLeft}');

    await user.click(submit());
    await waitFor(() => {
      expect(store.getState().ratings.get(550)?.score).toBe(9.5);
    });
  });

  it('mostra o contador de caracteres do comentário', async () => {
    const user = userEvent.setup();
    const { comment } = renderForm();
    expect(screen.getByText('0/500 caracteres')).toBeDefined();
    await user.type(comment(), 'Ótimo');
    expect(screen.getByText('5/500 caracteres')).toBeDefined();
  });

  it('salva a avaliação e, ao salvar de novo, substitui a anterior', async () => {
    const user = userEvent.setup();
    const { store, comment, submit, choose } = renderForm();

    await choose(user, '7,5');
    await user.type(comment(), 'Muito bom');
    await user.click(submit());

    await waitFor(() => {
      expect(store.getState().ratings.get(550)).toMatchObject({ score: 7.5, comment: 'Muito bom' });
    });
    expect(await screen.findByRole('button', { name: 'Atualizar avaliação' })).toBeDefined();
    expect(screen.getByText(/Você deu nota/).textContent).toContain('7,5');

    await choose(user, '9');
    await user.click(screen.getByRole('button', { name: 'Atualizar avaliação' }));

    await waitFor(() => {
      expect(store.getState().ratings.get(550)?.score).toBe(9);
    });
    expect(store.getState().ratings.size).toBe(1);
    expect(toastSuccess).toHaveBeenCalledTimes(2);
  });

  it('preenche o formulário com a avaliação já salva', async () => {
    const { store, comment, checkedScore } = renderForm();
    await store.saveRating({ movieId: 550, score: 6, comment: 'Revi' });
    await waitFor(() => {
      expect(checkedScore()).toBe('6 de 10');
    });
    expect(comment().value).toBe('Revi');
  });

  it('quando o salvamento falha, avisa e mantém os dados digitados', async () => {
    const user = userEvent.setup();
    const { store, comment, submit, choose, checkedScore } = renderForm(13, {
      repository: { shouldFail: (id: number) => String(id).endsWith('13') },
    });

    await choose(user, '4');
    await user.type(comment(), 'Não gostei');
    await user.click(submit());

    expect(await screen.findByText(/Seus dados continuam no formulário/)).toBeDefined();
    expect(toastError).toHaveBeenCalled();
    expect(checkedScore()).toBe('4 de 10');
    expect(comment().value).toBe('Não gostei');
    expect(store.getState().ratings.size).toBe(0);
  });

  it('exclui a avaliação', async () => {
    const user = userEvent.setup();
    const { store } = renderForm();
    await store.saveRating({ movieId: 550, score: 5 });

    await user.click(await screen.findByRole('button', { name: 'Excluir avaliação' }));

    await waitFor(() => {
      expect(store.getState().ratings.size).toBe(0);
    });
    expect(screen.getByRole('button', { name: 'Salvar avaliação' })).toBeDefined();
  });

  it('salva o snapshot do filme junto da avaliação', async () => {
    const user = userEvent.setup();
    const { store, submit, choose } = renderForm();
    await choose(user, '8');
    await user.click(submit());
    await waitFor(() => {
      expect(store.getState().ratings.get(550)?.movie).toMatchObject({
        id: 550,
        title: 'Clube da Luta',
        year: 1999,
      });
    });
  });

  it('tem link para a lista de avaliações', () => {
    renderForm();
    expect(
      screen.getByRole('link', { name: 'Ver todas as minhas avaliações' }).getAttribute('href'),
    ).toBe('/avaliacoes');
  });

  it('vindo de #avaliacao, foca o grupo de estrelas da nota', async () => {
    const { score } = renderForm(550, {}, '/#avaliacao');
    await waitFor(() => {
      expect(score().contains(document.activeElement)).toBe(true);
    });
  });
});
