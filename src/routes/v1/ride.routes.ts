import { Router } from "express";
import {
  completedRide,
  createRide,
  getAllAvailableRides,
  pickupController,
  requestRideController,
  updateRideRequestStatus,
} from "../../controllers";

const router = Router();

// ~ /api/v1/rides/:driverId POST
router.post("/:driverId", createRide);

// ~ /api/v1/rides/:driverId POST
router.post("/:driverId", requestRideController);

// * /api/v1/rides/:location/:destination GET
router.get("/:location/:destination", getAllAvailableRides);

// ^ /api/v1/rides/:rideRequestId PATCH
router.patch("/:rideRequestId", updateRideRequestStatus);

// ^ /api/v1/rides/:rideId PATCH
router.patch("/:rideId", pickupController);

// ~ /api/v1/rides/:rideId POST
router.post("/:rideId", completedRide);

export { router as rideRoutes };
