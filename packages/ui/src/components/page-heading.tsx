import { useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';

import { cn } from '../lib/utils';

export const APP_NAME = 'Nexo Filmes';

/** Marca no documento que a primeira página já foi exibida (vale para todos os remotes). */
const BOOT_FLAG = 'nexoBooted';

export interface PageHeadingProps extends ComponentProps<'h1'> {
  /** Título da aba, sem o nome do produto (ex.: "Favoritos"). */
  readonly documentTitle: string;
}

/**
 * `h1` da página. Ao montar, atualiza `document.title` e, em toda navegação
 * depois da carga inicial, recebe o foco para que leitores de tela anunciem
 * a nova página. Na carga inicial o foco fica no início do documento, para
 * que o link "Pular para o conteúdo" continue sendo o primeiro.
 */
export function PageHeading({ documentTitle, className, children, ...props }: PageHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = documentTitle ? `${documentTitle} · ${APP_NAME}` : APP_NAME;
  }, [documentTitle]);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset[BOOT_FLAG] === 'true') {
      ref.current?.focus({ preventScroll: false });
    } else {
      root.dataset[BOOT_FLAG] = 'true';
    }
  }, []);

  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className={cn('text-2xl font-bold tracking-tight text-balance sm:text-3xl', className)}
      {...props}
    >
      {children}
    </h1>
  );
}
