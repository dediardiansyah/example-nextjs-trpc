import { TRPCError } from '@trpc/server';
import { middleware } from '../createRouter';
import { Role } from '@/enums/role';

export const requireRole = (roles: Role[]) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user || !roles.includes(ctx.user.role as Role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    return next({ ctx });
  });
