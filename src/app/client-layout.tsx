'use client';

import { trpc, trpcClient } from '@/utils/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <trpc.Provider client={trpcClient} queryClient={queryClient}>
                    {children}
                </trpc.Provider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
