import { protectedProcedure, router } from '@/server/createRouter';
import { TRPCError } from '@trpc/server';
import { withErrorHandling } from '@/utils/withErrorHandling';
import { withTransaction } from '@/utils/withTransaction';
import { paginate } from '@/utils/paginate';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';
import { createRoomTypeSchema, roomTypeIdSchema, updateRoomTypeSchema } from '@/schemas/roomType';
import { requireRole } from '../middleware/requireRole';

type RoomType = Prisma.RoomTypeGetPayload<Prisma.RoomTypeFindManyArgs>;

export const roomTypeRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        return await paginate<RoomType>(ctx.prisma.roomType, {
          orderBy: { createdAt: 'desc' },
        }, input);
      })),

  getById: protectedProcedure
    .input(roomTypeIdSchema)
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        const roomType = await ctx.prisma.roomType.findUnique({
          where: { id: input.id },
        });

        if (!roomType) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'RoomType not found' });
        }

        return roomType;
      })),

  create: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(createRoomTypeSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          return await tx.roomType.create({
            data: {
              name: input.name,
            },
          });
        });
      })
    ),

  delete: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(roomTypeIdSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const roomType = await tx.roomType.findUnique({
            where: { id: input.id },
          });

          if (!roomType) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'RoomType not found' });
          }

          return await tx.roomType.delete({
            where: { id: input.id },
          });
        });
      })),

  update: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(updateRoomTypeSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const roomType = await tx.roomType.findUnique({ where: { id: input.id } });
          if (!roomType) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'RoomType not found' });
          }

          const data = {
            ...(input.name && { name: input.name }),
          };

          return await tx.roomType.update({
            where: { id: input.id },
            data,
          });
        });
      })),
});
