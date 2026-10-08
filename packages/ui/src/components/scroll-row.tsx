import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

import { scrollBehavior, useScrollEdges } from '../lib/use-scroll-edges';
import { cn } from '../lib/utils';

/** O aceno de "dá para rolar" acontece uma vez por carregamento da página. */
let hintShown = false;

export interface ScrollRowProps {
  readonly children: ReactNode;
  readonly scrollerRef?: RefObject<HTMLDivElement | null>;
  readonly previousLabel: string;
  readonly nextLabel: string;
  /**
   * Em telas de toque, desliza a faixa um pouco e volta, uma vez, para mostrar
   * que há mais itens. Desligado com prefers-reduced-motion.
   */
  readonly hint?: boolean;
  readonly className?: string;
  readonly scrollerClassName?: string;
}

function EdgeButton({
  side,
  visible,
  label,
  onClick,
}: {
  side: 'start' | 'end';
  visible: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = side === 'start' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      // As setas do teclado já percorrem os itens; o botão é atalho para o mouse.
      tabIndex={-1}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border bg-popover/90 text-popover-foreground shadow-md backdrop-blur-sm transition-[opacity,scale] duration-200 ease-out-soft can-hover:grid hover:scale-110 hover:bg-popover',
        side === 'start' ? '-left-1' : '-right-1',
        visible ? 'opacity-100' : 'pointer-events-none scale-75 opacity-0',
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}

/**
 * Faixa de rolagem horizontal que mostra que rola: as bordas esmaecem só do
 * lado em que há mais itens, setas aparecem para quem usa mouse e, no toque,
 * a faixa acena uma vez. A barra de rolagem fica escondida.
 */
export function ScrollRow({
  children,
  scrollerRef,
  previousLabel,
  nextLabel,
  hint = false,
  className,
  scrollerClassName,
}: ScrollRowProps) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = scrollerRef ?? ownRef;
  const edges = useScrollEdges(ref);
  const overflows = !(edges.start && edges.end);

  useEffect(() => {
    const el = ref.current;
    if (!hint || hintShown || !el || !overflows || el.scrollLeft > 0) return;
    const canHover =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover || scrollBehavior() === 'auto') return;
    hintShown = true;

    // Durante o aceno o snap fica desligado; senão a faixa encaixa no próximo
    // item e não volta. Se a pessoa tocar na faixa, o aceno para ali.
    const out = window.setTimeout(() => {
      el.style.scrollSnapType = 'none';
      el.scrollTo({ left: 56, behavior: 'smooth' });
    }, 700);
    const back = window.setTimeout(() => {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    }, 1300);
    const restore = window.setTimeout(() => {
      el.style.scrollSnapType = '';
    }, 1900);
    const cancel = () => {
      window.clearTimeout(out);
      window.clearTimeout(back);
      window.clearTimeout(restore);
      el.style.scrollSnapType = '';
    };
    el.addEventListener('pointerdown', cancel, { once: true });
    return () => {
      cancel();
      el.removeEventListener('pointerdown', cancel);
    };
  }, [hint, overflows, ref]);

  const scroll = (direction: 1 | -1) => {
    const el = ref.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: scrollBehavior() });
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={ref}
        data-overflow-start={edges.start ? undefined : ''}
        data-overflow-end={edges.end ? undefined : ''}
        className={cn(
          'scroll-fade flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          scrollerClassName,
        )}
      >
        {children}
      </div>
      <EdgeButton
        side="start"
        visible={!edges.start}
        label={previousLabel}
        onClick={() => {
          scroll(-1);
        }}
      />
      <EdgeButton
        side="end"
        visible={!edges.end}
        label={nextLabel}
        onClick={() => {
          scroll(1);
        }}
      />
    </div>
  );
}
