import { z } from 'zod';

export const createRoomTypeSchema = z.object({
    name: z.string(),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial().extend({ id: z.number() });

export const roomTypeIdSchema = z.object({ id: z.number() });