/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Token de leitura (v4) da API da TMDB. */
  readonly VITE_TMDB_TOKEN?: string;
  /** `true` liga a TMDB simulada (MSW) com o catálogo de demonstração. */
  readonly VITE_TMDB_MOCK?: string;
  readonly VITE_USER_DATA_MIN_DELAY_MS?: string;
  readonly VITE_USER_DATA_MAX_DELAY_MS?: string;
  readonly VITE_USER_DATA_FAIL_SUFFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
