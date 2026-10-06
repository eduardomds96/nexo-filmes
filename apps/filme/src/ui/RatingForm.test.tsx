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

function renderForm(movieId = 550, options = {}) {
  const utils = renderRoute(<RatingForm movie={{ id: movieId, title: 'Clube da Luta' }} />, {
    path: '/',
    initialEntry: '/',
    ...options,
  });
  return {
    ...utils,
    score: () => screen.getByLabelText<HTMLInputElement>('Nota'),
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
    expect(document.activeElement).toBe(score());
    expect(score().getAttribute('aria-invalid')).toBe('true');
    expect(comment().value).toBe(longComment);
  });

  it('com só o comentário inválido, o foco vai para o comentário', async () => {
    const user = userEvent.setup();
    const { score, comment, submit } = renderForm();

    await user.type(score(), '7,3');
    await user.click(comment());
    await user.paste('b'.repeat(501));
    await user.click(submit());

    expect(await screen.findByText(ratingMessages.scoreStep)).toBeDefined();
    // A nota também é inválida (passo), então ela continua sendo a primeira.
    expect(document.activeElement).toBe(score());

    await user.clear(score());
    await user.type(score(), '8');
    await user.click(submit());
    await waitFor(() => {
      expect(document.activeElement).toBe(comment());
    });
    expect(score().value).toBe('8');
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
    const { store, score, comment, submit } = renderForm();

    await user.type(score(), '7,5');
    await user.type(comment(), 'Muito bom');
    await user.click(submit());

    await waitFor(() => {
      expect(store.getState().ratings.get(550)).toMatchObject({ score: 7.5, comment: 'Muito bom' });
    });
    expect(await screen.findByRole('button', { name: 'Atualizar avaliação' })).toBeDefined();
    expect(screen.getByText(/Você deu nota/).textContent).toContain('7,5');

    await user.clear(score());
    await user.type(score(), '9');
    await user.click(screen.getByRole('button', { name: 'Atualizar avaliação' }));

    await waitFor(() => {
      expect(store.getState().ratings.get(550)?.score).toBe(9);
    });
    expect(store.getState().ratings.size).toBe(1);
    expect(toastSuccess).toHaveBeenCalledTimes(2);
  });

  it('preenche o formulário com a avaliação já salva', async () => {
    const { store, score, comment } = renderForm();
    await store.saveRating({ movieId: 550, score: 6, comment: 'Revi' });
    await waitFor(() => {
      expect(score().value).toBe('6');
    });
    expect(comment().value).toBe('Revi');
  });

  it('quando o salvamento falha, avisa e mantém os dados digitados', async () => {
    const user = userEvent.setup();
    const { store, score, comment, submit } = renderForm(13, {
      repository: { shouldFail: (id: number) => String(id).endsWith('13') },
    });

    await user.type(score(), '4');
    await user.type(comment(), 'Não gostei');
    await user.click(submit());

    expect(await screen.findByText(/Seus dados continuam no formulário/)).toBeDefined();
    expect(toastError).toHaveBeenCalled();
    expect(score().value).toBe('4');
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
});
