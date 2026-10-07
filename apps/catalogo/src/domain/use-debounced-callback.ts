import { useCallback, useEffect, useRef } from 'react';

export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Devolve uma função que só executa `callback` depois de `delayMs` sem novas
 * chamadas. Chamadas pendentes são descartadas ao desmontar.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): { run: (...args: Args) => void; cancel: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const run = useCallback(
    (...args: Args) => {
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        latest.current(...args);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  useEffect(() => cancel, [cancel]);

  return { run, cancel };
}
