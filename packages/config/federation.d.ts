export declare const PORTS: {
  readonly shell: 3000;
  readonly catalogo: 3001;
  readonly filme: 3002;
  readonly minha_area: 3003;
};

export declare function createShared(pkg: {
  dependencies?: Record<string, string>;
}): Record<string, { singleton: true; requiredVersion: string }>;

export declare function remoteEntries(env: Record<string, string | undefined>): {
  catalogo: string;
  filme: string;
  minha_area: string;
};
