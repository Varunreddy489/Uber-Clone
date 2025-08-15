import Router from "express";
import { rideRoutes } from "./ride.routes";
import { driverRoutes } from "./driver.routes";

const router = Router();

router.use("/rides", rideRoutes);
router.use("/driver", driverRoutes);

export { router as v1Routes };
