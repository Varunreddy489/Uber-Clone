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

/**
 * @openapi
 * /api/v1/driver:
 *   get:
 *     tags: [Driver]
 *     summary: Get all available drivers
 *     responses:
 *       "200":
 *         description: List of drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       "500":
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
 *                   example: "Internal server error"
 */
// * /api/v1/driver/ GET
router.get("/", getAllAvailableDriversController);

/**
 * @openapi
 * /api/v1/driver/{driverId}:
 *   put:
 *     tags: [Driver]
 *     summary: Update driver location
 *     description: Updates the driver's current location in the database and Redis cache.
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         description: Unique ID of the driver to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *             properties:
 *               location:
 *                 type: string
 *                 example: "1600 Amphitheatre Parkway, Mountain View, CA"
 *                 description: The updated address of the driver
 *     responses:
 *       200:
 *         description: Driver location updated successfully
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
 *                   example: Driver location updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "drv_12345"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *                     location:
 *                       type: string
 *                       example: "1600 Amphitheatre Parkway, Mountain View, CA"
 *                     curr_lat:
 *                       type: number
 *                       format: float
 *                       example: 37.4221
 *                     curr_long:
 *                       type: number
 *                       format: float
 *                       example: -122.0841
 *       400:
 *         description: Bad request (invalid input or failed update)
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
 *                   example: "Failed to update driver location"
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
 *                   example: "Failed to update driver location: Internal error"
 */
router.put("/:driverId", updateDriversLocationController);

/**
 * @openapi
 * /api/v1/driver/{driverId}/upload-docs:
 *   put:
 *     tags: [Driver]
 *     summary: Upload driver documents and create driver profile
 *     description: |
 *       Allows a user to upload driver documents (License + Government Proof) and create a driver profile.
 *       This will store the files in Cloudinary, persist driver details in the database, and notify the user by email.
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         description: Unique ID of the driver (user who is applying to be a driver).
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - LicenseNumber
 *               - LicenseImage
 *               - govt_proof
 *             properties:
 *               LicenseNumber:
 *                 type: string
 *                 example: "DL-0420110149646"
 *                 description: Driver's license number
 *               LicenseImage:
 *                 type: string
 *                 format: binary
 *                 description: Upload an image of the driver's license
 *               govt_proof:
 *                 type: string
 *                 format: binary
 *                 description: Upload an image of a government ID proof
 *     responses:
 *       200:
 *         description: Driver created successfully
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
 *                   example: "Driver created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "drv_12345"
 *                     userId:
 *                       type: string
 *                       example: "usr_67890"
 *                     phone_number:
 *                       type: string
 *                       example: "+1234567890"
 *                     LicenseNumber:
 *                       type: string
 *                       example: "DL-0420110149646"
 *                     LicenseImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/license.jpg"
 *                     Proof:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/govt_proof.jpg"
 *       400:
 *         description: Bad request (missing fields or files)
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
 *                   example: "License and Govt Proof are required"
 *       404:
 *         description: User not found
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
 *                   example: "User not found"
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
 *                   example: "Internal Server Error"
 */
router.put(
  "/:driverId/upload-docs",
  uploadRateLimit,
  uploadMiddleware("DRIVER_DOCUMENTS", [
    { name: "LicenseImage", maxCount: 1 },
    { name: "govt_proof", maxCount: 1 },
  ]),
  createDriver
);

/**
 * @openapi
 * /api/v1/driver/{driverId}:
 *   get:
 *     tags: [Driver]
 *     summary: Get driver by ID
 *     description: Fetch driver details including associated vehicle information.
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         description: Unique ID of the driver
 *         schema:
 *           type: string
 *           example: "drv_12345"
 *     responses:
 *       200:
 *         description: Driver details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "drv_12345"
 *                     userId:
 *                       type: string
 *                       example: "usr_67890"
 *                     phone_number:
 *                       type: string
 *                       example: "+1234567890"
 *                     LicenseNumber:
 *                       type: string
 *                       example: "DL-0420190145678"
 *                     LicenseImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/license.png"
 *                     Proof:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/govt_proof.png"
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "veh_98765"
 *                         vehicleType:
 *                           type: string
 *                           example: "Sedan"
 *                         vehicleNo:
 *                           type: string
 *                           example: "AB12CD3456"
 *                         seatCapacity:
 *                           type: integer
 *                           example: 4
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Bad request (missing or invalid driver ID)
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
 *                   example: "Driver ID is required"
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
 *                   example: "Unexpected error occurred"
 */
router.get("/:driverId", getDriverByIdController);


/**
 * @openapi
 * /api/v1/driver/{driverId}/status:
 *   put:
 *     tags: [Driver]
 *     summary: Toggle driver status
 *     description: Updates the active/inactive status of a driver.
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Driver status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "drv_12345"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid driver ID or request body
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
 *                   example: "Driver ID is required"
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
 *                   example: "Unexpected error occurred"
 *
 *   get:
 *     tags: [Driver]
 *     summary: Get driver status
 *     description: Fetches whether the driver is currently active or inactive.
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         description: Unique ID of the driver
 *         schema:
 *           type: string
 *           example: "drv_12345"
 *     responses:
 *       200:
 *         description: Driver status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isActive:
 *                       type: boolean
 *                       example: false
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
 *                   example: "Unexpected error occurred"
 */
router.put("/:driverId/status", toggleDriverStatusController);
router.get("/:driverId/status", getStatus);

/**
 * @openapi
 * /api/v1/driver/{driverId}/vehicle:
 *   post:
 *     tags: [Driver]
 *     summary: Register a vehicle
 *     description: Registers a new vehicle for a driver and uploads the vehicle image.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleNo
 *               - vehicleType
 *               - company
 *               - model
 *               - seatCapacity
 *               - vehicleImage
 *             properties:
 *               vehicleNo:
 *                 type: string
 *                 example: "KA01AB1234"
 *                 description: Vehicle registration number
 *               vehicleType:
 *                 type: string
 *                 example: "CAR"
 *                 description: Type of vehicle (e.g., CAR, BIKE, AUTO)
 *               company:
 *                 type: string
 *                 example: "Toyota"
 *                 description: Manufacturer of the vehicle
 *               model:
 *                 type: string
 *                 example: "Innova Crysta"
 *                 description: Vehicle model
 *               seatCapacity:
 *                 type: integer
 *                 example: 7
 *                 description: Number of seats available
 *               vehicleImage:
 *                 type: string
 *                 format: binary
 *                 description: Vehicle image file
 *     responses:
 *       201:
 *         description: Vehicle registered successfully
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
 *                   example: Vehicle registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "veh_98765"
 *                     driverId:
 *                       type: string
 *                       example: "drv_12345"
 *                     vehicleNo:
 *                       type: string
 *                       example: "KA01AB1234"
 *                     vehicleType:
 *                       type: string
 *                       example: "CAR"
 *                     company:
 *                       type: string
 *                       example: "Toyota"
 *                     model:
 *                       type: string
 *                       example: "Innova Crysta"
 *                     seatCapacity:
 *                       type: integer
 *                       example: 7
 *                     vehicleImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v1234567890/vehicle.jpg"
 *       400:
 *         description: Invalid request or missing fields
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
 *                   example: "Vehicle image is required"
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
 *                   example: "error in vehicleRegisterService: Internal Server Error"
 */
// ~ /api/v1/driver/:driverId/vehicle POST
router.post("/:driverId/vehicle", registerVehicle);

export { router as driverRoutes };
