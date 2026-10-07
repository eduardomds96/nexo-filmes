import type { ComponentProps } from 'react';

import { cn } from '../lib/utils';

/*
 * Ilustrações dos estados vazios. Usam só tokens de cor, então acompanham os
 * dois temas. São decorativas: o texto do estado vazio diz tudo.
 */

type ArtProps = Omit<ComponentProps<'svg'>, 'children'>;

function Art({ className, viewBox = '0 0 200 160', ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={viewBox}
      className={cn('h-32 w-auto sm:h-36', className)}
      {...props}
    />
  );
}

/** Balde de pipoca com um coração: "nenhum favorito ainda". */
export function PopcornHeartArt({ className, ...props }: ArtProps) {
  return (
    <Art className={className} {...props}>
      <ellipse cx="100" cy="146" rx="62" ry="8" className="fill-muted" />
      {/* Pipocas */}
      {[
        [70, 52, 14],
        [88, 42, 15],
        [108, 40, 15],
        [127, 48, 14],
        [80, 62, 13],
        [100, 56, 14],
        [120, 62, 13],
      ].map(([cx, cy, r]) => (
        <circle
          key={`${String(cx)}-${String(cy)}`}
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth="2"
          className="fill-secondary stroke-muted-foreground/40"
        />
      ))}
      {/* Balde listrado */}
      <path d="M58 66h84l-10 76H68z" className="fill-card stroke-border" strokeWidth="2" />
      <path
        d="M72 66h12l-3 76h-9zM100 66h12l-2 76h-10zM128 66h12l-8 76h-6z"
        className="fill-primary"
      />
      <path d="M54 62h92a4 4 0 0 1 0 8H54a4 4 0 0 1 0-8z" className="fill-highlight" />
      {/* Coração flutuando */}
      <g className="motion-safe:animate-float">
        <circle cx="160" cy="34" r="20" className="fill-primary/15" />
        <path
          d="M160 46s-12-7.2-12-15.2a6.4 6.4 0 0 1 12-3.2 6.4 6.4 0 0 1 12 3.2c0 8-12 15.2-12 15.2z"
          className="fill-highlight"
        />
      </g>
      <path
        d="M36 30v8M32 34h8M174 82v6M171 85h6"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-highlight/60"
      />
    </Art>
  );
}

/** Gráfico vazio com estrela: "seu painel ainda não tem números". */
export function EmptyChartArt({ className, ...props }: ArtProps) {
  return (
    <Art className={className} {...props}>
      <ellipse cx="100" cy="146" rx="70" ry="8" className="fill-muted" />
      <rect
        x="34"
        y="22"
        width="132"
        height="112"
        rx="14"
        className="fill-card stroke-border"
        strokeWidth="2"
      />
      <path d="M52 112h96" strokeWidth="2" strokeLinecap="round" className="stroke-border" />
      {[
        [58, 82, 30],
        [80, 66, 46],
        [102, 92, 20],
        [124, 54, 58],
      ].map(([x, y, h]) => (
        <rect
          key={x}
          x={x}
          y={y}
          width="14"
          height={h}
          rx="4"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="fill-transparent stroke-muted-foreground/50"
        />
      ))}
      <g className="motion-safe:animate-float">
        <circle cx="160" cy="30" r="20" className="fill-primary/15" />
        <path
          d="m160 17 3.9 7.9 8.7 1.3-6.3 6.1 1.5 8.7-7.8-4.1-7.8 4.1 1.5-8.7-6.3-6.1 8.7-1.3z"
          className="fill-highlight"
        />
      </g>
    </Art>
  );
}
