import { TRPCError } from '@trpc/server';

export const withErrorHandling = <TInput, TOutput>(
    procedure: (opts: TInput) => Promise<TOutput>
) => {
    return async (opts: TInput): Promise<TOutput> => {
        try {
            return await procedure(opts);
        } catch (error) {
            console.error('tRPC Error:', error);
            if (error instanceof TRPCError) throw error;
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error' });
        }
    };
};
