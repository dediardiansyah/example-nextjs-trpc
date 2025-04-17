import { router } from "@/server/createRouter";
import { userRouter } from "./routers/user";
import { adminRouter } from "./routers/admin";
import { towerRouter } from "./routers/tower";
import { floorRouter } from "./routers/floor";
import { roomTypeRouter } from "./routers/roomType";
import { facilityRouter } from "./routers/facility";
import { unitRouter } from "./routers/unit";
import { reservationRouter } from "./routers/reservation";

export const appRouter = router({
    admin: adminRouter,
    user: userRouter,
    tower: towerRouter,
    floor: floorRouter,
    roomType: roomTypeRouter,
    facility: facilityRouter,
    unit: unitRouter,
    reservation: reservationRouter,
});

export type AppRouter = typeof appRouter;
