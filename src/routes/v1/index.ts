import Router from "express";
import { rideRoutes } from "./ride.routes";
import { driverRoutes } from "./driver.routes";
import { authRoutes } from "./auth.routes";

const router = Router();

router.use("/rides", rideRoutes);
router.use("/auth", authRoutes);
router.use("/driver", driverRoutes);

export { router as v1Routes };
