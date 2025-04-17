import { createUnitSchema, unitIdSchema, updateUnitSchema } from '@/schemas/unit';
import { protectedProcedure, router } from '@/server/createRouter';
import { paginate } from '@/utils/paginate';
import { deleteFile, uploadFile } from '@/utils/uploadFile';
import { withErrorHandling } from '@/utils/withErrorHandling';
import { withTransaction } from '@/utils/withTransaction';
import { Prisma, UnitStatus, UserRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole';

type UnitWithImages = Prisma.UnitGetPayload<{
    include: {
        facilities: {
            select: {
                facility: {
                    select: {
                        name: true
                    }
                }
            }
        },
        roomType: {
            select: {
                name: true,
            }
        },
        images: true;
    }
}>;

export const unitRouter = router({
    getAll: protectedProcedure
        .input(
            z.object({
                page: z.number().optional(),
                limit: z.number().optional(),
                unitCode: z.string().optional(),
                facilityId: z.coerce.number().optional(),
                roomTypeId: z.coerce.number().optional(),
            })
        )
        .query(
            withErrorHandling(async ({ ctx, input }) => {
                return await paginate<UnitWithImages>(
                    ctx.prisma.unit,
                    {
                        where: {
                            unitCode: input.unitCode
                                ? { contains: input.unitCode }
                                : undefined,
                            roomTypeId: input.roomTypeId || undefined,
                            facilities: input.facilityId
                                ? {
                                    some: {
                                        facilityId: input.facilityId,
                                    },
                                }
                                : undefined,
                        },
                        include: {
                            images: true,
                            facilities: {
                                select: {
                                    facility: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                            roomType: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    input
                );
            })
        ),

    getById: protectedProcedure
        .input(unitIdSchema)
        .query(
            withErrorHandling(async ({ ctx, input }) => {
                const unit = await ctx.prisma.unit.findUnique({
                    where: { id: input.id },
                });

                if (!unit) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' });
                }

                return unit;
            })),

    create: protectedProcedure
        .use(requireRole([UserRole.admin]))
        .input(createUnitSchema)
        .mutation(
            withErrorHandling(async ({ ctx, input }) => {
                return await withTransaction(ctx.prisma, async (tx) => {
                    const floor = await tx.floor.findUnique({
                        where: { id: input.floorId },
                    });

                    if (!floor) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Floor not found',
                        });
                    }

                    const roomType = await tx.roomType.findUnique({
                        where: { id: input.roomTypeId },
                    });

                    if (!roomType) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Room type not found',
                        });
                    }

                    const unit = await tx.unit.create({
                        data: {
                            floorId: input.floorId,
                            roomTypeId: input.roomTypeId,
                            priceOffer: input.priceOffer,
                            semiGrossArea: input.semiGrossArea,
                            unitCode: input.unitCode,
                            status: input.status,
                        },
                    });

                    if (input.images && Array.isArray(input.images) && input.images.length > 0) {
                        for (const image of input.images) {
                            const uploaded = await uploadFile(image);
                            await tx.unitImage.create({
                                data: {
                                    unitId: unit.id,
                                    imageUrl: uploaded.path,
                                    description: "",
                                },
                            });
                        }
                    }

                    if (input.facilities && Array.isArray(input.facilities) && input.facilities.length > 0) {
                        const facilities = await tx.facility.findMany({
                            where: {
                                id: { in: input.facilities },
                            },
                        });

                        if (facilities.length !== input.facilities.length) {
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: 'One or more facilities not found',
                            });
                        }

                        for (const facilityId of input.facilities) {
                            await tx.unitFacility.create({
                                data: {
                                    unitId: unit.id,
                                    facilityId,
                                },
                            });
                        }
                    }

                    return unit;
                });
            })
        ),


    delete: protectedProcedure
        .use(requireRole([UserRole.admin]))
        .input(unitIdSchema)
        .mutation(
            withErrorHandling(async ({ ctx, input }) => {
                return await withTransaction(ctx.prisma, async (tx) => {
                    const unit = await tx.unit.findUnique({
                        where: { id: input.id },
                        include: {
                            images: true,
                        }
                    });

                    if (!unit) {
                        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' });
                    }

                    if (unit.images.length > 0) {
                        for (const image of unit.images) {
                            if (image.imageUrl) {
                                await deleteFile(image.imageUrl);
                            }
                        }
                    }

                    return await tx.unit.delete({
                        where: { id: input.id },
                    });
                });
            })),

    update: protectedProcedure
        .use(requireRole([UserRole.admin]))
        .input(updateUnitSchema)
        .mutation(
            withErrorHandling(async ({ ctx, input }) => {
                return await withTransaction(ctx.prisma, async (tx) => {
                    const unit = await tx.unit.findUnique({
                        where: { id: Number(input.id) },
                        include: {
                            images: true,
                            facilities: true,
                        },
                    });

                    if (!unit) {
                        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' });
                    }

                    const data: {
                        floorId?: number;
                        roomTypeId?: number;
                        priceOffer?: number;
                        semiGrossArea?: number;
                        unitCode?: string;
                        status?: UnitStatus;
                    } = {};

                    if (input.floorId) {
                        const floor = await tx.floor.findUnique({ where: { id: input.floorId } });
                        if (!floor) {
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: 'Floor not found',
                            });
                        }
                        data.floorId = input.floorId;
                    }

                    if (input.roomTypeId) {
                        const roomType = await tx.roomType.findUnique({ where: { id: input.roomTypeId } });
                        if (!roomType) {
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: 'Room type not found',
                            });
                        }
                        data.roomTypeId = input.roomTypeId;
                    }

                    if (input.priceOffer) data.priceOffer = input.priceOffer;
                    if (input.semiGrossArea) data.semiGrossArea = input.semiGrossArea;
                    if (input.unitCode) data.unitCode = input.unitCode;
                    if (input.status) data.status = input.status;

                    const updatedUnit = await tx.unit.update({
                        where: { id: Number(input.id) },
                        data,
                    });

                    if (input.images && Array.isArray(input.images) && input.images.length > 0) {
                        for (const image of unit.images) {
                            if (image.imageUrl) {
                                await deleteFile(image.imageUrl);
                            }
                        }

                        for (const image of input.images) {
                            const uploaded = await uploadFile(image);
                            await tx.unitImage.create({
                                data: {
                                    unitId: updatedUnit.id,
                                    imageUrl: uploaded.path,
                                    description: "",
                                },
                            });
                        }
                    }

                    if (input.facilities && Array.isArray(input.facilities) && input.facilities.length > 0) {
                        const facilities = await tx.facility.findMany({
                            where: {
                                id: { in: input.facilities },
                            },
                        });

                        if (facilities.length !== input.facilities.length) {
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: 'One or more facilities not found',
                            });
                        }

                        await tx.unitFacility.deleteMany({
                            where: {
                                unitId: updatedUnit.id,
                            },
                        });

                        for (const facilityId of input.facilities) {
                            await tx.unitFacility.create({
                                data: {
                                    unitId: updatedUnit.id,
                                    facilityId,
                                },
                            });
                        }
                    }

                    return updatedUnit;
                });
            })
        )

});
