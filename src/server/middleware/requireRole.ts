import { TRPCError } from '@trpc/server';
import { middleware } from '../createRouter';
import { UserRole } from '@prisma/client';

export const requireRole = (roles: UserRole[]) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user || !roles.includes(ctx.user.role as UserRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    return next({ ctx });
  });
