import { protectedProcedure, router } from '@/server/createRouter';
import { TRPCError } from '@trpc/server';
import { withErrorHandling } from '@/utils/withErrorHandling';
import { withTransaction } from '@/utils/withTransaction';
import { paginate } from '@/utils/paginate';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';
import { createFacilitySchema, facilityIdSchema, updateFacilitySchema } from '@/schemas/facility';
import { requireRole } from '../middleware/requireRole';

type Facility = Prisma.FacilityGetPayload<Prisma.FacilityFindManyArgs>;

export const facilityRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        return await paginate<Facility>(ctx.prisma.facility, {
          orderBy: { createdAt: 'desc' },
        }, input);
      })
    ),

  getById: protectedProcedure
    .input(facilityIdSchema)
    .query(
      withErrorHandling(async ({ ctx, input }) => {
        const facility = await ctx.prisma.facility.findUnique({
          where: { id: input.id },
        });

        if (!facility) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Facility not found' });
        }

        return facility;
      })),

  create: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(createFacilitySchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          return await tx.facility.create({
            data: {
              name: input.name,
            },
          });
        });
      })
    ),

  delete: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(facilityIdSchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const facility = await tx.facility.findUnique({
            where: { id: input.id },
          });

          if (!facility) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Facility not found' });
          }

          return await tx.facility.delete({
            where: { id: input.id },
          });
        });
      })),

  update: protectedProcedure
    .use(requireRole([UserRole.admin]))
    .input(updateFacilitySchema)
    .mutation(
      withErrorHandling(async ({ ctx, input }) => {
        return await withTransaction(ctx.prisma, async (tx) => {
          const facility = await tx.facility.findUnique({ where: { id: input.id } });
          if (!facility) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Facility not found' });
          }

          const data = {
            ...(input.name && { name: input.name }),
          };

          return await tx.facility.update({
            where: { id: input.id },
            data,
          });
        });
      })),
});
