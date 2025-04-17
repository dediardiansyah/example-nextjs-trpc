import { protectedProcedure, router } from '@/server/createRouter';
import { TRPCError } from '@trpc/server';
import { withErrorHandling } from '@/utils/withErrorHandling';
import { createTowerSchema, updateTowerSchema, towerIdSchema } from '@/schemas/tower';
import { withTransaction } from '@/utils/withTransaction';
import { paginate } from '@/utils/paginate';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

type Tower = Prisma.TowerGetPayload<Prisma.TowerFindManyArgs>;

export const towerRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        return await paginate<Tower>(ctx.prisma.tower, {
          orderBy: { createdAt: 'desc' },
        }, input);
      })
    ),

  getById: protectedProcedure
    .input(towerIdSchema)
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        const tower = await ctx.prisma.tower.findUnique({
          where: { id: input.id },
        });

        if (!tower) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Tower not found' });
        }

        return tower;
      })),

  create: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(createTowerSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          return await tx.tower.create({
            data: {
              name: input.name,
            },
          });
        });
      })
    ),

  delete: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(towerIdSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const tower = await tx.tower.findUnique({
            where: { id: input.id },
          });

          if (!tower) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Tower not found' });
          }

          return await tx.tower.delete({
            where: { id: input.id },
          });
        });
      })),

  update: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(updateTowerSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const tower = await tx.tower.findUnique({ where: { id: input.id } });
          if (!tower) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Tower not found' });
          }

          const data = {
            ...(input.name && { name: input.name }),
          };

          return await tx.tower.update({
            where: { id: input.id },
            data,
          });
        });
      })),
});
