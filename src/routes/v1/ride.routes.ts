import { Router } from "express";
import {
  createRide,
  completedRide,
  createRideRating,
  pickupController,
  getAllAvailableRides,
  requestRideController,
  updateRideRequestStatus,
} from "../../controllers";
import { validateRequest } from "../../middleware";
import { createRideRatingValidation } from "../../validations";

const router = Router();

/**
 * @openapi
 * /api/v1/rides/{driverId}:
 *   post:
 *     tags: [Ride]
 *     summary: Create a ride
 *     description: Creates a new ride between a user and a driver, calculates distance, fare, and estimated time.
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         description: Unique ID of the driver
 *         schema:
 *           type: string
 *           example: "drv_12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - vehicleId
 *               - userLocation
 *               - destination
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "usr_67890"
 *                 description: The ID of the user requesting the ride
 *               vehicleId:
 *                 type: string
 *                 example: "veh_98765"
 *                 description: The ID of the vehicle assigned to the ride
 *               userLocation:
 *                 type: string
 *                 example: "HSR Layout, Bangalore"
 *                 description: Pickup location of the user
 *               destination:
 *                 type: string
 *                 example: "Koramangala, Bangalore"
 *                 description: Drop location of the user
 *     responses:
 *       201:
 *         description: Ride created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ride accepted
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "ride_123456"
 *                     status:
 *                       type: string
 *                       example: "ACCEPTED"
 *                     estimatedDistance:
 *                       type: number
 *                       format: float
 *                       example: 12.5
 *                     estimatedDuration:
 *                       type: string
 *                       example: "30 mins"
 *                     totalFare:
 *                       type: number
 *                       format: float
 *                       example: 250.75
 *                     pickupLocation:
 *                       type: string
 *                       example: "HSR Layout, Bangalore"
 *                     destinationAddress:
 *                       type: string
 *                       example: "Koramangala, Bangalore"
 *                     driver:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "drv_12345"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         phoneNumber:
 *                           type: string
 *                           example: "+919876543210"
 *                         vehicle:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "veh_98765"
 *                             vehicleNo:
 *                               type: string
 *                               example: "KA01AB1234"
 *                             vehicleType:
 *                               type: string
 *                               example: "CAR"
 *                             seatCapacity:
 *                               type: integer
 *                               example: 4
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "usr_67890"
 *                         name:
 *                           type: string
 *                           example: "Alice"
 *                         email:
 *                           type: string
 *                           example: "alice@example.com"
 *       400:
 *         description: Bad request (invalid input or driver unavailable)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Driver is not available"
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Driver not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error in createRideService: Internal error"
 */
// ~ /api/v1/rides/:driverId POST
router.post("/:driverId", createRide);

/**
 * @openapi
 * /api/v1/rides/{driverId}:
 *   post:
 *     tags: [Ride]
 *     summary: Create a ride
 *     description: Creates a new ride between a user and a driver, calculates distance, fare, and estimated time.
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         description: Unique ID of the driver
 *         schema:
 *           type: string
 *           example: "drv_12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - vehicleId
 *               - userLocation
 *               - destination
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "usr_67890"
 *                 description: The ID of the user requesting the ride
 *               vehicleId:
 *                 type: string
 *                 example: "veh_98765"
 *                 description: The ID of the vehicle assigned to the ride
 *               userLocation:
 *                 type: string
 *                 example: "HSR Layout, Bangalore"
 *                 description: Pickup location of the user
 *               destination:
 *                 type: string
 *                 example: "Koramangala, Bangalore"
 *                 description: Drop location of the user
 *     responses:
 *       201:
 *         description: Ride created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ride accepted
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "ride_123456"
 *                     status:
 *                       type: string
 *                       example: "ACCEPTED"
 *                     estimatedDistance:
 *                       type: number
 *                       format: float
 *                       example: 12.5
 *                     estimatedDuration:
 *                       type: string
 *                       example: "30 mins"
 *                     totalFare:
 *                       type: number
 *                       format: float
 *                       example: 250.75
 *                     pickupLocation:
 *                       type: string
 *                       example: "HSR Layout, Bangalore"
 *                     destinationAddress:
 *                       type: string
 *                       example: "Koramangala, Bangalore"
 *                     driver:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "drv_12345"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         phoneNumber:
 *                           type: string
 *                           example: "+919876543210"
 *                         vehicle:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "veh_98765"
 *                             vehicleNo:
 *                               type: string
 *                               example: "KA01AB1234"
 *                             vehicleType:
 *                               type: string
 *                               example: "CAR"
 *                             seatCapacity:
 *                               type: integer
 *                               example: 4
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "usr_67890"
 *                         name:
 *                           type: string
 *                           example: "Alice"
 *                         email:
 *                           type: string
 *                           example: "alice@example.com"
 *       400:
 *         description: Bad request (invalid input or driver unavailable)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Driver is not available"
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Driver not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error in createRideService: Internal error"
 */

// ~ /api/v1/rides/:driverId POST
router.post("/:driverId", requestRideController);

/**
 * @openapi
 * /api/v1/rides/{location}/{destination}:
 *   get:
 *     tags: [Ride]
 *     summary: Get available rides near a location to a destination
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: The current location of the user
 *       - in: path
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: The destination location
 *     responses:
 *       200:
 *         description: A list of available rides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       driverId:
 *                         type: string
 *                       driverName:
 *                         type: string
 *                       vehicleType:
 *                         type: string
 *                       phone_number:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                       distance:
 *                         type: number
 *                       total_distance:
 *                         type: number
 *                       estimatedFare:
 *                         type: object
 *                         properties:
 *                           baseFare:
 *                             type: number
 *                           distanceFare:
 *                             type: number
 *                           timeFare:
 *                             type: number
 *                           surgeFare:
 *                             type: number
 *                           totalFare:
 *                             type: number
 *                       location:
 *                         type: object
 *                         properties:
 *                           location:
 *                             type: string
 *                           curr_lat:
 *                             type: number
 *                           curr_long:
 *                             type: number
 *       400:
 *         description: Invalid input (e.g., location missing)
 *       500:
 *         description: Server error
 */

// * /api/v1/rides/:location/:destination GET
router.get("/:location/:destination", getAllAvailableRides);

/**
 * @openapi
 * /api/v1/rides/{rideRequestId}:
 *   patch:
 *     tags: [Ride]
 *     summary: Update ride request status
 *     parameters:
 *       - in: path
 *         name: rideRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ride request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               rideId:
 *                 type: string
 *                 description: The ID of the ride (needed when accepting)
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, REJECTED, CANCELLED, TIMED_OUT]
 *                 description: The new status of the ride request
 *     responses:
 *       200:
 *         description: Ride request status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Ride or driver not found
 *       500:
 *         description: Server error
 */

// ^ /api/v1/rides/:rideRequestId PATCH
router.patch("/:rideRequestId", updateRideRequestStatus);

/**
 * @openapi
 * /api/v1/rides/{rideId}:
 *   patch:
 *     tags: [Ride]
 *     summary: Pickup a passenger (mark ride as In Progress)
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ride to update
 *     responses:
 *       200:
 *         description: Ride marked as In Progress successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ride started successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: IN_PROGRESS
 *                     pickupTime:
 *                       type: string
 *                       format: date-time
 *                     userId:
 *                       type: string
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Server error
 */

// ^ /api/v1/rides/:rideId PATCH
router.patch("/:rideId", pickupController);

/**
 * @openapi
 * paths:
 *   /api/v1/rides/{rideId}:             # ~ /api/v1/rides/:rideId POST
 *     post:
 *       tags: [Ride]
 *       summary: Mark ride as completed
 *       description: >
 *         Marks a ride as completed by updating its status,
 *         setting drop time, calculating duration and total fare.
 *       parameters:
 *         - in: path
 *           name: rideId
 *           required: true
 *           schema:
 *             type: string
 *             example: "ride_12345"
 *           description: The ID of the ride to complete
 *       responses:
 *         "200":
 *           description: Ride completed successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: Ride completed successfully
 *                   data:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "ride_12345"
 *                       status:
 *                         type: string
 *                         example: COMPLETED
 *                       dropTime:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-07T14:30:00Z"
 *                       duration:
 *                         type: number
 *                         example: 25
 *                       totalFare:
 *                         type: number
 *                         example: 320.5
 *         "400":
 *           description: Ride start or end time missing
 *         "404":
 *           description: Ride not found
 *         "500":
 *           description: Server error
 */
// ~ /api/v1/rides/:rideId/:driverId/rating POST
router.post(
  "/:rideId/:driverId/rating",
  validateRequest(createRideRatingValidation),
  createRideRating
);

export { router as rideRoutes };
