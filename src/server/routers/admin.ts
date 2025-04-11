import { protectedProcedure, router } from "@/server/createRouter";
import { Role } from "@/enums/role";
import { requireRole } from "../middleware/requireRole";

export const adminRouter = router({
    getSecretStats: protectedProcedure
        .use(requireRole([Role.ADMIN]))
        .query(async () => {
            return { users: 9999, revenue: '$123K' };
        }),
});
