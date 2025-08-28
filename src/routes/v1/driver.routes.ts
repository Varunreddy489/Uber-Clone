import { Router } from "express";
import {
  createDriver,
  updateDriversLocationController,
  getAllAvailableDriversController,
  getDriverByIdController,
  toggleDriverStatusController,
  getStatus,
  registerVehicle,
} from "../../controllers";
import { uploadMiddleware } from "../../middleware";
import { uploadRateLimit } from "../../utils/common";

const router = Router();

// * /api/v1/driver/ GET
router.get("/", getAllAvailableDriversController);

// & /api/v1/driver/:driverId PUT
router.put("/:driverId", updateDriversLocationController);

// & /api/v1/driver/:driverId/create PUT
router.put(
  "/:driverId/upload-docs",
  uploadRateLimit,
  uploadMiddleware("DRIVER_DOCUMENTS", [
    { name: "LicenseImage", maxCount: 1 },
    { name: "govt_proof", maxCount: 1 },
  ]),
  createDriver
);

// * /api/v1/driver/:driverId GET
router.get("/:driverId", getDriverByIdController);

// & /api/v1/driver/:driverId/status PUT
router.put("/:driverId/status", toggleDriverStatusController);

// * /api/v1/driver/:driverId/status GET
router.get("/:driverId/status", getStatus);

// ~ /api/v1/driver/:driverId/vehicle POST
router.post("/:driverId", registerVehicle);

export { router as driverRoutes };
