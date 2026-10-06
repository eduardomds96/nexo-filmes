import { Film } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../lib/utils';

const SIZES = {
  list: { width: 342, height: 513 },
  detail: { width: 500, height: 750 },
} as const;

export interface MoviePosterProps {
  readonly src: string | null;
  readonly title: string;
  readonly size?: keyof typeof SIZES;
  /** Carregar já (acima da dobra) em vez de sob demanda. */
  readonly eager?: boolean;
  readonly className?: string;
}

/** Pôster com proporção fixa (sem layout shift) e placeholder acessível. */
export function MoviePoster({
  src,
  title,
  size = 'list',
  eager = false,
  className,
}: MoviePosterProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { width, height } = SIZES[size];
  const classes = cn('aspect-[2/3] w-full rounded-lg bg-muted object-cover', className);

  if (src === null || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={`Pôster indisponível: ${title}`}
        className={cn(classes, 'flex flex-col items-center justify-center gap-2 p-4 text-center')}
      >
        <Film aria-hidden="true" className="size-10 text-muted-foreground" />
        <span aria-hidden="true" className="line-clamp-3 text-sm text-muted-foreground">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Pôster do filme ${title}`}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={classes}
      onError={() => {
        setFailedSrc(src);
      }}
    />
  );
}
