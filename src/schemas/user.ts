import { UserRole } from '@prisma/client';
import { z } from 'zod';
export const createUserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum([UserRole.admin, UserRole.salesman, UserRole.supervisor]),
});

export const updateUserSchema = createUserSchema.partial().extend({ id: z.number() });

export const userIdSchema = z.object({ id: z.number() });