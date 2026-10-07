import type { ComponentType } from 'react';

/** Nomes dos micro-frontends remotos, como registrados no Module Federation. */
export type RemoteName = 'catalogo' | 'filme' | 'minha_area';

/**
 * Módulos expostos por cada remote e o formato que o Shell espera receber.
 * Todo módulo exposto tem um `default` que é um componente React.
 */
export interface RemoteModuleMap {
  'catalogo/CatalogPage': ComponentType;
  'filme/MoviePage': ComponentType;
  'minha_area/FavoritesPage': ComponentType;
  'minha_area/DashboardPage': ComponentType;
  'minha_area/RatingsPage': ComponentType;
  'minha_area/FavoritesCounter': ComponentType<FavoritesCounterProps>;
}

export type RemoteModuleId = keyof RemoteModuleMap;

export interface FavoritesCounterProps {
  readonly className?: string;
}
