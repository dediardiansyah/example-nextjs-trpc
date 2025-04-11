import { PrismaClient } from '@prisma/client';

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export const withTransaction = async <T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(fn);
};
