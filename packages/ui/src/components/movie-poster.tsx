import { Film } from 'lucide-react';
import { useState } from 'react';

import { IMAGE_FADE_CLASSES, useImageFade } from '../lib/use-image-fade';
import { cn } from '../lib/utils';

const SIZES = {
  list: { width: 342, height: 513 },
  detail: { width: 500, height: 750 },
} as const;

/** Largura exibida em cada tela, para o navegador escolher a imagem do `srcSet`. */
const DEFAULT_SIZES: Record<keyof typeof SIZES, string> = {
  list: '(min-width: 1280px) 240px, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 47vw',
  detail: '(min-width: 768px) 256px, (min-width: 640px) 176px, 144px',
};

export interface MoviePosterProps {
  readonly src: string | null;
  readonly title: string;
  readonly size?: keyof typeof SIZES;
  /** Mesma imagem em várias larguras (ex.: `tmdbPosterSrcSet`). */
  readonly srcSet?: string | undefined;
  /** Largura exibida; o padrão segue o `size`. */
  readonly sizes?: string | undefined;
  /**
   * Pôster acima da dobra, candidato a LCP: carrega já, com prioridade alta e
   * sem o efeito de aparecer suave, que atrasaria a primeira pintura.
   */
  readonly priority?: boolean;
  /**
   * Nome de View Transition (ex.: `poster-550`): o mesmo nome na lista e no
   * detalhe faz o pôster viajar de um para o outro na navegação.
   */
  readonly transitionName?: string | undefined;
  readonly className?: string;
}

/** Pôster com proporção fixa (sem layout shift) e placeholder acessível. */
export function MoviePoster({
  src,
  title,
  size = 'list',
  srcSet,
  sizes,
  priority = false,
  transitionName,
  className,
}: MoviePosterProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const fade = useImageFade();
  const { width, height } = SIZES[size];
  const style = transitionName ? { viewTransitionName: transitionName } : undefined;
  const classes = cn('aspect-[2/3] w-full rounded-lg bg-muted object-cover', className);

  if (src === null || failedSrc === src) {
    return (
      <div
        role="img"
        style={style}
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
      {...(srcSet ? { srcSet, sizes: sizes ?? DEFAULT_SIZES[size] } : {})}
      alt={`Pôster do filme ${title}`}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? {} : fade)}
      style={style}
      className={cn(classes, !priority && IMAGE_FADE_CLASSES)}
      onError={() => {
        setFailedSrc(src);
      }}
    />
  );
}
