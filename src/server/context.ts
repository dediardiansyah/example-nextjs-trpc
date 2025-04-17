import { getToken } from 'next-auth/jwt';
import { NextApiRequest } from 'next';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function createContext({ req }: { req: NextApiRequest }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const user = token
        ? {
            id: Number(token.id),
            email: token.email as string,
            role: token.role as UserRole,
        }
        : null;

    return { prisma, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
