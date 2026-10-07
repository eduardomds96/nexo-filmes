import { Star } from 'lucide-react';
import { useImperativeHandle, useRef, useState } from 'react';
import type { KeyboardEvent, Ref } from 'react';

import { formatUserScore } from '../lib/format';
import { cn } from '../lib/utils';

const STARS = 10;
const STEP = 0.5;
const VALUES = Array.from({ length: STARS / STEP }, (_, index) => (index + 1) * STEP);

export interface StarRatingInputHandle {
  focus: () => void;
}

export interface StarRatingInputProps {
  /** Nota escolhida (0,5–10) ou `null` sem nota. */
  readonly value: number | null;
  readonly onChange: (value: number) => void;
  readonly onBlur?: () => void;
  /** `focus()` vai para o rádio que recebe Tab (o escolhido, ou o primeiro). */
  readonly ref?: Ref<StarRatingInputHandle>;
  readonly id?: string;
  readonly 'aria-labelledby': string;
  readonly 'aria-describedby'?: string | undefined;
  readonly 'aria-invalid'?: boolean | undefined;
  readonly 'aria-required'?: boolean;
  readonly className?: string;
}

function clampToScale(value: number): number {
  return Math.min(STARS, Math.max(STEP, value));
}

/**
 * Nota em estrelas com meia estrela, como grupo de rádios acessível (padrão
 * ARIA "radio group"): Tab entra e sai do grupo; setas, Home e End trocam a
 * nota; cada metade de estrela é um rádio com nome próprio ("7,5 de 10").
 */
export function StarRatingInput({
  value,
  onChange,
  onBlur,
  ref,
  id,
  className,
  ...aria
}: StarRatingInputProps) {
  const radios = useRef(new Map<number, HTMLSpanElement>());
  const [preview, setPreview] = useState<number | null>(null);
  const tabbable = value ?? VALUES[0] ?? STEP;
  const shown = preview ?? value ?? 0;

  useImperativeHandle(ref, () => ({ focus: () => radios.current.get(tabbable)?.focus() }), [
    tabbable,
  ]);

  const select = (next: number) => {
    const clamped = clampToScale(next);
    onChange(clamped);
    radios.current.get(clamped)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>, current: number) => {
    // Pelo teclado, a prévia do mouse não pode esconder a nota escolhida.
    setPreview(null);
    const moves: Record<string, number> = {
      ArrowRight: current + STEP,
      ArrowUp: current + STEP,
      ArrowLeft: current - STEP,
      ArrowDown: current - STEP,
      Home: STEP,
      End: STARS,
    };
    if (event.key in moves) {
      event.preventDefault();
      // Sem nota, a primeira seta escolhe o rádio em foco (0,5) em vez de pular.
      select(
        value === null && event.key.startsWith('Arrow') ? current : (moves[event.key] ?? current),
      );
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      select(current);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <div
        id={id}
        role="radiogroup"
        {...aria}
        className="group flex"
        onPointerLeave={() => {
          setPreview(null);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
        }}
      >
        {Array.from({ length: STARS }, (_, index) => {
          const full = index + 1;
          const fill = Math.min(1, Math.max(0, shown - index));
          return (
            <span key={full} className="relative grid size-7 place-items-center sm:size-8">
              <Star
                aria-hidden="true"
                className="size-6 text-muted-foreground group-aria-invalid:text-destructive sm:size-7"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center overflow-hidden transition-[clip-path] duration-150"
                style={{ clipPath: `inset(0 ${String((1 - fill) * 100)}% 0 0)` }}
              >
                <Star className="size-6 fill-rating text-rating sm:size-7" />
              </span>
              {[full - STEP, full].map((radioValue) => (
                <span
                  key={radioValue}
                  ref={(element) => {
                    if (element) radios.current.set(radioValue, element);
                    else radios.current.delete(radioValue);
                  }}
                  role="radio"
                  aria-checked={value === radioValue}
                  aria-label={`${formatUserScore(radioValue)} de 10`}
                  tabIndex={radioValue === tabbable ? 0 : -1}
                  onClick={() => {
                    select(radioValue);
                  }}
                  onKeyDown={(event) => {
                    onKeyDown(event, radioValue);
                  }}
                  onPointerEnter={() => {
                    setPreview(radioValue);
                  }}
                  className={cn(
                    'absolute inset-y-0 z-10 w-1/2 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    radioValue === full ? 'right-0' : 'left-0',
                  )}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span aria-hidden="true" className="min-w-16 text-sm font-medium tabular-nums">
        {shown > 0 ? (
          <>
            <span className="font-display text-lg">{formatUserScore(shown)}</span>
            <span className="text-muted-foreground"> / 10</span>
          </>
        ) : (
          <span className="text-muted-foreground">Sem nota</span>
        )}
      </span>
    </div>
  );
}
