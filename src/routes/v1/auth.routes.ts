import { Router } from "express";
import {
  loginUser,
  verifyOTP,
  logoutUser,
  refreshToken,
  registerUser,
  resetPassword,
  forgotPassword,
} from "../../controllers";
import { validateRequest } from "../../middleware";
import { loginSchema, registerSchema } from "../../validations";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - phone_number
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone_number:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: securePassword@123
 *               profileImage:
 *                 type: string
 *                 nullable: true
 *                 example: "https://example.com/image.jpg"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 nullable: true
 *                 example: "Male"
 *               location:
 *                 type: string
 *                 nullable: true
 *                 example: "New York, NY"
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "clm7x8y9z0000abcd1234efgh"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         phone_number:
 *                           type: string
 *                           example: "+1234567890"
 *                         role:
 *                           type: string
 *                           example: "USER"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       409:
 *         description: User already exists
 */

// ~ /api/v1/auth/register POST
router.post("/register", validateRequest(registerSchema), registerUser);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: securePassword@123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "clm7x8y9z0000abcd1234efgh"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 */
// ~ /api/v1/auth/login POST
router.post("/login", validateRequest(loginSchema), loginUser);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout a user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
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
 *                   example: "Logged out successfully"
 */
// ~ /api/v1/auth/logout POST
router.post("/logout", logoutUser);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "clm7x8y9z0000abcd1234efgh"
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid refresh token
 */
// ~ /api/v1/auth/refresh POST
router.post("/refresh", refreshToken);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
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
 *                   example: "Password reset email sent successfully"
 *       404:
 *         description: User not found
 */
// ~ /api/v1/auth/forgot-password POST
router.post("/forgot-password", forgotPassword);

/**
 * @openapi
 * /api/v1/auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP for password reset or phone verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 example: john.doe@example.com
 *               phone_number:
 *                 type: string
 *                 nullable: true
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: "OTP verified successfully"
 *       400:
 *         description: Invalid or expired OTP
 */
// ~ /api/v1/auth/verify-otp POST
router.post("/verify-otp", verifyOTP);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset_token_here"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: "Password reset successfully"
 *       400:
 *         description: Invalid or expired token
 */
// ~ /api/v1/auth/reset-password POST
router.post("/reset-password", resetPassword);

export { router as authRoutes };
