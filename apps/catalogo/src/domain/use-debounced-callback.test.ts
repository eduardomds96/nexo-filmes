import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SEARCH_DEBOUNCE_MS, useDebouncedCallback } from './use-debounced-callback';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedCallback', () => {
  it('usa 400 ms na busca', () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(400);
  });

  it('executa uma vez, com o último valor, 400 ms depois da última chamada', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, SEARCH_DEBOUNCE_MS));

    for (const value of ['m', 'ma', 'mat', 'matr', 'matri', 'matrix']) {
      result.current.run(value);
      vi.advanceTimersByTime(100);
    }
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('matrix');
  });

  it('pausas maiores que o atraso disparam uma execução por pausa', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 400));

    result.current.run('ma');
    vi.advanceTimersByTime(400);
    result.current.run('mat');
    vi.advanceTimersByTime(400);

    expect(callback.mock.calls).toEqual([['ma'], ['mat']]);
  });

  it('cancel descarta a chamada pendente', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 400));

    result.current.run('x');
    result.current.cancel();
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('desmontar descarta a chamada pendente', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 400));

    result.current.run('x');
    unmount();
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('usa sempre o callback mais recente', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 400), {
      initialProps: { cb: first },
    });

    result.current.run('x');
    rerender({ cb: second });
    vi.advanceTimersByTime(400);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('x');
  });
});
