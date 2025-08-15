import { Router } from "express";
import {
  updateDriversLocationController,
  getAllAvailableDriversController,
} from "../../controllers";

const router = Router();

// * /api/v1/driver/ GET
router.get("/", getAllAvailableDriversController);

// * /api/v1/driver/:driverId PUT
router.put("/:driverId", updateDriversLocationController);

export { router as driverRoutes };
