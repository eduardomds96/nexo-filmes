import { Toaster } from '@nexo/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router';

import { createQueryClient } from './query-client';
import { createAppRouter } from './router';

/**
 * Providers que o Shell oferece a todos os remotes: roteador, QueryClient e
 * Toaster. Os remotes usam as mesmas instâncias porque React Router,
 * TanStack Query e sonner são singletons do Module Federation.
 */
export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(createAppRouter);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
