import { formatScore } from '../lib/format';
import { cn } from '../lib/utils';

const SIZE = 56;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface ScoreRingProps {
  /** Nota de 0 a 10. */
  readonly value: number;
  /** Texto lido por leitores de tela antes da nota (ex.: "Nota da TMDB"). */
  readonly label?: string;
  readonly className?: string;
}

/**
 * Nota em anel circular. O anel e o número são decorativos; leitores de tela
 * recebem a frase completa ("Nota da TMDB: 8,4 de 10").
 */
export function ScoreRing({ value, label = 'Nota da TMDB', className }: ScoreRingProps) {
  const clamped = Math.min(10, Math.max(0, value));
  const offset = CIRCUMFERENCE * (1 - clamped / 10);

  return (
    <span className={cn('relative inline-grid size-14 shrink-0 place-items-center', className)}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-current opacity-20"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="stroke-primary"
        />
      </svg>
      <span aria-hidden="true" className="font-display text-base font-bold tabular-nums">
        {formatScore(clamped)}
      </span>
      <span className="sr-only">{`${label}: ${formatScore(clamped)} de 10`}</span>
    </span>
  );
}
