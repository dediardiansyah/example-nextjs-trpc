import { protectedProcedure, router } from '@/server/createRouter';
import { TRPCError } from '@trpc/server';
import { withErrorHandling } from '@/utils/withErrorHandling';
import { withTransaction } from '@/utils/withTransaction';
import { z } from 'zod';
import { createFloorSchema, floorIdSchema, updateFloorSchema } from '@/schemas/floor';
import { deleteFile, uploadFile } from '@/utils/uploadFile';
import { paginate } from '@/utils/paginate';
import { Prisma, UserRole } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

type FloorWithTower = Prisma.FloorGetPayload<{
  include: {
    tower: {
      select: {
        name: true,
      }
    }
  };
}>;

export const floorRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        return await paginate<FloorWithTower>(
          ctx.prisma.floor,
          {
            include: {
              tower: {
                select: { name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          input
        );
      })),

  getById: protectedProcedure
    .input(floorIdSchema)
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        const floor = await ctx.prisma.floor.findUnique({
          where: { id: input.id },
          include: {
            tower: {
              select: { name: true },
            },
          },
        });

        if (!floor) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Floor not found' });
        }

        return floor;
      })),

  create: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(createFloorSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        let floorPlanImageUrl = "";

        if (input.floorPlanImage) {
          floorPlanImageUrl = (await uploadFile(input.floorPlanImage)).path;
        }

        return await withTransaction(ctx.prisma, async (tx) => {
          const tower = await tx.tower.findUnique({ where: { id: Number(input.towerId) } });
          if (!tower) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Tower not found',
            });
          }

          return await tx.floor.create({
            data: {
              towerId: Number(input.towerId),
              label: input.label,
              floorPlanImageUrl,
              number: Number(input.number),
            },
          });
        });
      })
    ),

  delete: protectedProcedure
    .input(floorIdSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const floor = await tx.floor.findUnique({
            where: { id: input.id },
          });

          if (!floor) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Floor not found' });
          }

          if (floor.floorPlanImageUrl) {
            await deleteFile(floor.floorPlanImageUrl);
          }

          return await tx.floor.delete({
            where: { id: input.id },
          });
        });
      })),

  update: protectedProcedure
    .input(updateFloorSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const floor = await tx.floor.findUnique({ where: { id: Number(input.id) } });
          if (!floor) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Floor not found' });
          }

          let floorPlanImageUrl = "";

          if (input.floorPlanImage) {
            const uploaded = await uploadFile(input.floorPlanImage);
            floorPlanImageUrl = uploaded.path;

            if (floor.floorPlanImageUrl) {
              await deleteFile(floor.floorPlanImageUrl);
            }
          }

          const data: {
            number?: number;
            towerId?: number;
            label?: string;
            floorPlanImageUrl?: string;
          } = {};

          if (input.towerId) {
            const tower = await tx.tower.findUnique({ where: { id: Number(input.towerId) } });
            if (!tower) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Tower not found',
              });
            }

            data.towerId = Number(input.towerId);
          }

          if (input.label) data.label = input.label;
          if (floorPlanImageUrl) data.floorPlanImageUrl = floorPlanImageUrl;
          if (input.number) data.number = Number(input.number);

          return await tx.floor.update({
            where: { id: Number(input.id) },
            data,
          });
        });
      })
    ),
});
