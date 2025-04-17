import { UnitStatus } from '@prisma/client';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileSchema = z
    .instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, {
        message: 'File size must be less than 5MB',
    })
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
        message: 'Unsupported file type. Only JPG, PNG, and WEBP are allowed.',
    });

export const createUnitSchema = zfd.formData({
    floorId: zfd.numeric(),
    roomTypeId: zfd.numeric(),
    status: z.enum([UnitStatus.available]),
    priceOffer: zfd.numeric(),
    semiGrossArea: zfd.numeric(),
    unitCode: zfd.text(),
    facilities: z.array(z.coerce.number()),
    images: z.array(fileSchema),
});

export const updateUnitSchema = zfd.formData({
    id: zfd.text(z.coerce.number()),
    floorId: zfd.numeric().optional(),
    roomTypeId: zfd.numeric().optional(),
    status: z.enum([UnitStatus.available]).optional(),
    priceOffer: zfd.numeric().optional(),
    semiGrossArea: zfd.numeric().optional(),
    unitCode: zfd.text().optional(),
    facilities: z.array(z.coerce.number()).optional(),
    images: z.array(fileSchema).optional(),
});

export const unitIdSchema = z.object({ id: z.number() });
