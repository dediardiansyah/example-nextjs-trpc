import { protectedProcedure, router } from "@/server/createRouter";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "@prisma/client";

export const adminRouter = router({
    getSecretStats: protectedProcedure
        .use(requireRole([UserRole.admin]))
        .query(async () => {
            return { users: 9999, revenue: '$123K' };
        }),
});
