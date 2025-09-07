import Router from "express";
import { rideRoutes } from "./ride.routes";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { driverRoutes } from "./driver.routes";
import { walletRoutes } from "./wallet.routes";

const router = Router();

router.use("/rides", rideRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/wallet", walletRoutes);
router.use("/driver", driverRoutes);

export { router as v1Routes };
