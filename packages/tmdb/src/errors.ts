export type TmdbErrorKind =
  | 'rate-limit'
  | 'not-found'
  | 'unauthorized'
  | 'missing-token'
  | 'server'
  | 'network'
  | 'invalid-response';

const MESSAGES: Record<TmdbErrorKind, string> = {
  'rate-limit': 'Muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente.',
  'not-found': 'Não encontramos o que você procurou.',
  unauthorized: 'O acesso à TMDB foi recusado. Verifique o token configurado.',
  'missing-token': 'O token da TMDB não foi configurado (VITE_TMDB_TOKEN).',
  server: 'A TMDB está com problemas no momento. Tente novamente em instantes.',
  network: 'Não foi possível conectar. Verifique sua internet e tente novamente.',
  'invalid-response': 'A TMDB respondeu num formato inesperado.',
};

export class TmdbError extends Error {
  override readonly name = 'TmdbError';
  readonly kind: TmdbErrorKind;
  readonly status: number | null;
  /** Segundos sugeridos pelo cabeçalho `Retry-After`, quando houver. */
  readonly retryAfterSeconds: number | null;

  constructor(
    kind: TmdbErrorKind,
    options: { status?: number; retryAfterSeconds?: number | null; cause?: unknown } = {},
  ) {
    super(MESSAGES[kind], { cause: options.cause });
    this.kind = kind;
    this.status = options.status ?? null;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

export function isTmdbError(error: unknown): error is TmdbError {
  return error instanceof TmdbError;
}

/**
 * Só falhas transitórias de rede ou do servidor merecem nova tentativa
 * automática. 429 nunca: repetir só agrava o limite de requisições.
 */
export function isRetryableTmdbError(error: unknown): boolean {
  return isTmdbError(error) && (error.kind === 'network' || error.kind === 'server');
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
