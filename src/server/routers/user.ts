import { protectedProcedure, router } from '@/server/createRouter';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { withErrorHandling } from '@/utils/withErrorHandling';
import { withTransaction } from '@/utils/withTransaction';
import { createUserSchema, updateUserSchema, userIdSchema } from '@/schemas/user';
import { paginate } from '@/utils/paginate';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

type User = Prisma.UserGetPayload<Prisma.UserFindManyArgs>;

export const userRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        return await paginate<User>(ctx.prisma.user,
          {
            orderBy: { createdAt: 'desc' },
            omit: { password: true },
          }, input);
      })
    ),

  getById: protectedProcedure
    .input(userIdSchema)
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.id },
          omit: { password: true },
        });

        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        return user;
      })
    ),

  create: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(createUserSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const hashedPassword = await bcrypt.hash(input.password, 10);

          const user = await tx.user.create({
            data: {
              name: input.name,
              email: input.email,
              password: hashedPassword,
              role: input.role,
            },
          });

          return user;
        });
      })
    ),

  update: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(updateUserSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const user = await tx.user.findUnique({ where: { id: input.id } });
          if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
          }

          const data = {
            ...(input.name && { name: input.name }),
            ...(input.email && { email: input.email }),
            ...(input.role && { role: input.role }),
            ...(input.password && { password: await bcrypt.hash(input.password, 10) }),
          };

          return await tx.user.update({
            where: { id: input.id },
            data,
          });
        });
      })
    ),

  delete: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(userIdSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: input.id },
          });

          if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
          }

          if (user.id === ctx.user!.id) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You are not allowed to delete yourself',
            });
          }

          return await tx.user.delete({
            where: { id: input.id },
          });
        });
      })
    ),
});
