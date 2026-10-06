import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import {
  createLocalUserDataRepository,
  createMemoryStorage,
  createUserDataStore,
  UserDataProvider,
} from '@nexo/user-data';
import type { LocalRepositoryOptions } from '@nexo/user-data';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

interface RenderOptions {
  readonly path: string;
  readonly initialEntry: string;
  readonly repository?: Partial<LocalRepositoryOptions>;
}

/** Renderiza uma página do remote com o que o Shell forneceria: roteador, QueryClient e store. */
export function renderRoute(
  element: ReactElement,
  { path, initialEntry, repository }: RenderOptions,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const store = createUserDataStore({
    repository: createLocalUserDataRepository({
      storage: createMemoryStorage(),
      delay: 0,
      shouldFail: () => false,
      ...repository,
    }),
  });
  const router = createMemoryRouter([{ path, element }], { initialEntries: [initialEntry] });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <UserDataProvider store={store}>
        <RouterProvider router={router} />
      </UserDataProvider>
    </QueryClientProvider>,
  );

  return {
    ...utils,
    router,
    store,
    queryClient,
    /** Query string atual, como objeto. */
    search: () => Object.fromEntries(new URLSearchParams(router.state.location.search)),
  };
}
