import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/appRouter';
import { createContext } from '@/server/context';

export default createNextApiHandler({
    router: appRouter,
    createContext,
});
