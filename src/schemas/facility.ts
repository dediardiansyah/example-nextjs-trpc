import { z } from 'zod';

export const createFacilitySchema = z.object({
    name: z.string(),
});

export const updateFacilitySchema = createFacilitySchema.partial().extend({ id: z.number() });

export const facilityIdSchema = z.object({ id: z.number() });