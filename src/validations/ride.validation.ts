import { body } from "express-validator";
import { VEHICLE_TYPES } from "../utils/constants/rideConstants";

export const validateRideRequest = [
  body("userId").notEmpty().withMessage("userId is required"),

  body("driverId").notEmpty().withMessage("driverId is required"),

  body("curr_location").notEmpty().withMessage("Current location is required"),

  body("destination").notEmpty().withMessage("Destination is required"),
];
