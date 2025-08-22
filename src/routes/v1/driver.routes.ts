import { Router } from "express";
import {
  createDriver,
  updateDriversLocationController,
  getAllAvailableDriversController,
} from "../../controllers";
import { uploadMiddleware } from "../../middleware";
import { uploadRateLimit } from "../../utils/common";

const router = Router();

// * /api/v1/driver/ GET
router.get("/", getAllAvailableDriversController);

// & /api/v1/driver/:driverId PUT
router.put("/:driverId", updateDriversLocationController);

// & /api/v1/driver/:driverId/upload-docs PUT
router.put(
  "/:driverId/upload-docs",
  uploadRateLimit,
  uploadMiddleware("DRIVER_DOCUMENTS", [
    { name: "LicenseImage", maxCount: 1 },
    { name: "govt_proof", maxCount: 1 },
  ]),
  createDriver
);

export { router as driverRoutes };
