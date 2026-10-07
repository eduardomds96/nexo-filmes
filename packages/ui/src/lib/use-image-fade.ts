import { useCallback, useState } from 'react';

/**
 * Imagem que aparece suavemente quando termina de carregar. Use as props
 * devolvidas no `<img>` com as classes de `IMAGE_FADE_CLASSES`. Imagens que já
 * vieram do cache (completas antes do React ligar o evento) aparecem direto.
 * Com prefers-reduced-motion, base.css zera a transição.
 */
export function useImageFade() {
  const [loaded, setLoaded] = useState(false);
  const ref = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, []);
  return {
    ref,
    onLoad: () => {
      setLoaded(true);
    },
    'data-loaded': loaded ? '' : undefined,
  };
}

export const IMAGE_FADE_CLASSES =
  'opacity-0 transition-opacity duration-500 data-loaded:opacity-100';
