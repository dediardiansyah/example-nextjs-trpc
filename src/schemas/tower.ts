import { z } from 'zod';

export const createTowerSchema = z.object({
    name: z.string(),
});

export const updateTowerSchema = createTowerSchema.partial().extend({ id: z.number() });

export const towerIdSchema = z.object({ id: z.number() });