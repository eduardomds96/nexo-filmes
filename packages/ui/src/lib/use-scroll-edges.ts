import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

export interface ScrollEdges {
  /** Está no começo (nada escondido à esquerda). */
  readonly start: boolean;
  /** Está no fim (nada escondido à direita). */
  readonly end: boolean;
}

/**
 * Acompanha se uma área de rolagem horizontal tem conteúdo escondido de cada
 * lado. Atualiza ao rolar, ao mudar de tamanho e quando os itens mudam (ex.:
 * a lista de gêneros chega depois).
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>({ start: true, end: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = el.scrollLeft <= 1;
    const end = el.scrollLeft >= max - 1;
    setEdges((current) =>
      current.start === start && current.end === end ? current : { start, end },
    );
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resize?.observe(el);
    const mutation = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update);
    mutation?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener('scroll', update);
      resize?.disconnect();
      mutation?.disconnect();
    };
  }, [ref, update]);

  return edges;
}

export function scrollBehavior(): ScrollBehavior {
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduce ? 'auto' : 'smooth';
}
