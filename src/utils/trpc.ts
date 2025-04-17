'use client';

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import superjson from 'superjson';
import { AppRouter } from '@/server/appRouter';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => op.input instanceof FormData,
      true: httpLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
      false: httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
    }),
  ],
});
