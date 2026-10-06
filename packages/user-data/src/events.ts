import type { NexoEventMap, NexoEventName } from '@nexo/contracts';

/**
 * Helpers tipados para os eventos trocados entre micro-frontends.
 * Usam `CustomEvent` em `window`, de modo que funcionam mesmo entre remotes
 * com cópias diferentes deste pacote.
 */

export function emit<K extends NexoEventName>(
  name: K,
  detail: NexoEventMap[K],
  target: EventTarget = window,
): void {
  target.dispatchEvent(new CustomEvent(name, { detail }));
}

export function subscribe<K extends NexoEventName>(
  name: K,
  handler: (detail: NexoEventMap[K]) => void,
  target: EventTarget = window,
): () => void {
  const listener = (event: Event) => {
    if (event instanceof CustomEvent) handler(event.detail as NexoEventMap[K]);
  };
  target.addEventListener(name, listener);
  return () => {
    target.removeEventListener(name, listener);
  };
}
