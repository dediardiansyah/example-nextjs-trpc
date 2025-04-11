import { router } from "@/server/createRouter";
import { userRouter } from "./routers/user";
import { adminRouter } from "./routers/admin";
import { towerRouter } from "./routers/tower";

export const appRouter = router({
    admin: adminRouter,
    user: userRouter,
    tower: towerRouter,
});

export type AppRouter = typeof appRouter;
