import { z } from 'zod';
import { Role } from '@/enums/role';

export const createUserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum([Role.ADMIN, Role.SALESMAN, Role.SUPERVISOR]),
});

export const updateUserSchema = createUserSchema.partial().extend({ id: z.number() });

export const userIdSchema = z.object({ id: z.number() });