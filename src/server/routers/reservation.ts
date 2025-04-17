import { protectedProcedure, router } from '@/server/createRouter';
import { TRPCError } from '@trpc/server';
import { withErrorHandling } from '@/utils/withErrorHandling';
import { withTransaction } from '@/utils/withTransaction';
import { deleteFile, uploadFile } from '@/utils/uploadFile';
import { ReservationStatus, UserRole, UnitStatus, Prisma } from '@prisma/client';
import { requireRole } from '@/server/middleware/requireRole';
import { createReservationSchema, updateReservationStatuSchema, uploadReservationPaymentProofSchema } from '@/schemas/reservation';
import { z } from 'zod';
import { paginate } from '@/utils/paginate';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
    include: {
        unit: true;
        customer: true;
        salesman: true;
    };
}>;

export const reservationRouter = router({
    getAll: protectedProcedure
        .use(requireRole([UserRole.salesman, UserRole.supervisor]))
        .input(
            z.object({
                page: z.number().optional(),
                limit: z.number().optional(),
            })
        )
        .query(
            withErrorHandling(async ({ ctx, input }) => {
                return await paginate<ReservationWithRelations>(
                    ctx.prisma.reservation,
                    {
                        include: {
                            unit: true,
                            customer: true,
                            salesman: true,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                    input
                );
            })
        ),

    getById: protectedProcedure
        .use(requireRole([UserRole.salesman, UserRole.supervisor]))
        .input(z.object({ id: z.string() }))
        .query(
            withErrorHandling(async ({ ctx, input }) => {
                const reservation = await ctx.prisma.reservation.findUnique({
                    where: { uuid: input.id },
                    include: {
                        unit: true,
                        customer: true,
                        salesman: true,
                    },
                });

                if (!reservation) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation not found' });
                }

                return reservation;
            })
        ),

    create: protectedProcedure
        .use(requireRole([UserRole.salesman, UserRole.supervisor]))
        .input(createReservationSchema)
        .mutation(withErrorHandling(async ({ ctx, input }) => {
            return await withTransaction(ctx.prisma, async (tx) => {
                const customer = await tx.customer.create({ data: input.customer });

                return await tx.reservation.create({
                    data: {
                        unitId: input.reservation.unitId,
                        mediaSourceCategory: input.reservation.mediaSourceCategory,
                        mediaSourceDesc: input.reservation.mediaSourceDesc,
                        notes: input.reservation.notes,
                        paymentType: input.reservation.paymentType,
                        salesmanId: ctx.user!.id,
                        customerId: customer.id,
                        status: ReservationStatus.reserved,
                        payment_proof_url: '',
                    }
                });
            });
        })),

    uploadPaymentProof: protectedProcedure
        .use(requireRole([UserRole.salesman, UserRole.supervisor]))
        .input(uploadReservationPaymentProofSchema)
        .mutation(withErrorHandling(async ({ ctx, input }) => {
            return await withTransaction(ctx.prisma, async (tx) => {
                const reservation = await tx.reservation.findUnique({
                    where: { uuid: input.reservationUuid },
                });

                if (!reservation) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation not found' });
                }

                if (reservation.payment_proof_url) {
                    await deleteFile(reservation.payment_proof_url);
                }

                const proof = await uploadFile(input.paymentProof);


                await tx.reservation.update({
                    where: { uuid: input.reservationUuid },
                    data: {
                        status: ReservationStatus.paid,
                        payment_proof_url: proof.path,
                    },
                });

                await tx.unit.update({
                    where: { id: reservation.unitId },
                    data: { status: UnitStatus.reserved },
                });

                return { success: true };
            });
        })),

    updateStatus: protectedProcedure
        .use(requireRole([UserRole.supervisor]))
        .input(updateReservationStatuSchema)
        .mutation(withErrorHandling(async ({ ctx, input }) => {
            return await withTransaction(ctx.prisma, async (tx) => {
                const reservation = await tx.reservation.findUnique({
                    where: { uuid: input.reservationUuid },
                });

                if (!reservation) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation not found' });
                }

                let unitStatusUpdate: UnitStatus;

                if (input.status === ReservationStatus.booked) {
                    unitStatusUpdate = UnitStatus.booked;
                } else {
                    unitStatusUpdate = UnitStatus.available;
                }

                await tx.reservation.update({
                    where: { uuid: input.reservationUuid },
                    data: { status: input.status },
                });

                await tx.unit.update({
                    where: { id: reservation.unitId },
                    data: { status: unitStatusUpdate },
                });

                return { success: true };
            });
        })),
});
