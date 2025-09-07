import { Router } from "express";
import { changeRole, getUserById } from "../../controllers";

const router = Router();

/**
 * @openapi
 * /api/v1/user/{userId}:
 *   put:
 *     tags: [User]
 *     summary: Request a role change for a user
 *     description: Creates a role change request (e.g. passenger → driver). Admins can later approve or reject it.
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user requesting a role change
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRole
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [PASSENGER, DRIVER, ADMIN]
 *                 example: DRIVER
 *     responses:
 *       200:
 *         description: Role change request submitted successfully
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// & /api/v1/user/:userId PUT
router.put("/:userId", changeRole);

/**
 * @openapi
 * /api/v1/user/{userId}:
 *   get:
 *     tags: [User]
 *     summary: Get user by ID
 *     description: Fetch user details along with their ride requests.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User and rides fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: User fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         phone_number:
 *                           type: string
 *                         gender:
 *                           type: string
 *                         profileImage:
 *                           type: string
 *                         dateOfBirth:
 *                           type: string
 *                           format: date
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     rides:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userLocation:
 *                             type: string
 *                           destination:
 *                             type: string
 *                           totalFare:
 *                             type: number
 *                           distance:
 *                             type: number
 *                           vehicleType:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// * /api/v1/user/:userId GET
router.get("/:userId", getUserById);

export { router as userRoutes };
