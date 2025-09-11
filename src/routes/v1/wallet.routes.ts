import { Router } from "express";
import {
  createWalletTopUpIntent,
  driverWalletStats,
  userWalletStats,
  walletRefund,
  walletTopUpSuccess,
} from "../../controllers";

const router = Router();

/**
 * @openapi
 *   /api/v1/wallet/topup/intent:
 *     post:                                # & /api/v1/wallet/topup/intent POST
 *       tags: [Wallet]
 *       summary: Create wallet top-up intent
 *       description: >
 *         Creates a Stripe payment intent for topping up the user's wallet.
 *         Validates user, ensures wallet exists, and records a pending payment.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - amount
 *               properties:
 *                 amount:
 *                   type: number
 *                   description: Amount to top-up (between 1 and 9999)
 *                   example: 150
 *       responses:
 *         "200":
 *           description: Stripe intent created successfully
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
 *                     example: Stripe intent created successfully
 *                   data:
 *                     type: object
 *                     properties:
 *                       clientSecret:
 *                         type: string
 *                         example: "pi_3OyH6n2eZvKYlo2C_secret_s0m3SeCrEt"
 *                       paymentIntentId:
 *                         type: string
 *                         example: "pi_3OyH6n2eZvKYlo2C"
 *                       paymentId:
 *                         type: string
 *                         example: "pay_123456"
 *                       amount:
 *                         type: number
 *                         example: 150
 *         "400":
 *           description: Invalid amount
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: false
 *                   error:
 *                     type: string
 *                     example: Amount must be between 0 and 10,000
 *         "404":
 *           description: User not found
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: false
 *                   error:
 *                     type: string
 *                     example: User not found
 *         "500":
 *           description: Server error during payment intent creation
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: false
 *                   error:
 *                     type: string
 *                     example: Payment processing failed: Internal error
 *
 *     get:                                 # & /api/v1/wallet/topup/intent GET
 *       tags: [Wallet]
 *       summary: Confirm wallet top-up success
 *       description: >
 *         Confirms if a wallet top-up was successful using the payment intent.
 *         (Implementation detail needed in controller).
 *       parameters:
 *         - in: query
 *           name: paymentIntentId
 *           required: true
 *           schema:
 *             type: string
 *           description: The Stripe PaymentIntent ID to confirm
 *           example: "pi_3OyH6n2eZvKYlo2C"
 *       responses:
 *         "200":
 *           description: Wallet top-up confirmed
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
 *                     example: Wallet top-up successful
 *                   data:
 *                     type: object
 *                     properties:
 *                       walletId:
 *                         type: string
 *                         example: "wallet_123"
 *                       balance:
 *                         type: number
 *                         example: 500.75
 *         "400":
 *           description: Missing or invalid paymentIntentId
 *         "404":
 *           description: Payment or wallet not found
 *         "500":
 *           description: Server error
 */
// & /api/v1/wallet/topup/intent POST
router.post("/topup/intent", createWalletTopUpIntent);

/**
 * @openapi
 * /api/v1/wallet/topup/success:
 *   post:
 *     tags: [Wallet]
 *     summary: Wallet Top-up Success
 *     description: Confirms a successful wallet top-up after Stripe payment succeeds and updates the wallet balance and transactions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 description: The Stripe payment intent ID
 *             required:
 *               - paymentIntentId
 *     responses:
 *       "200":
 *         description: Wallet top-up successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Wallet top-up successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         balance:
 *                           type: number
 *                         userId:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         walletId:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         transactionType:
 *                           type: string
 *                           example: CREDIT
 *                         description:
 *                           type: string
 *                           example: Wallet top-up via Stripe
 *                         referenceId:
 *                           type: string
 *                         balanceBefore:
 *                           type: number
 *                         balanceAfter:
 *                           type: number
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       "400":
 *         description: Payment intent ID is required or invalid payment
 *       "404":
 *         description: Wallet not found
 *       "500":
 *         description: Internal server error
 */
// * /api/v1/wallet/topup/success POST
router.post("/topup/success", walletTopUpSuccess);

/**
 * @openapi
 * /api/v1/wallet/user:
 *   get:
 *     tags: [Wallet]
 *     summary: Get User Wallet Stats
 *     description: Fetch the wallet details of the authenticated user, including the last 10 wallet transactions.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Successfully fetched user wallet stats
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
 *                   example: Fetching user wallet stats successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "wallet_123"
 *                     userId:
 *                       type: string
 *                       example: "user_123"
 *                     balance:
 *                       type: number
 *                       example: 500.75
 *                     WalletTransaction:
 *                       type: array
 *                       description: Last 10 transactions of the wallet
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "txn_001"
 *                           walletId:
 *                             type: string
 *                             example: "wallet_123"
 *                           amount:
 *                             type: number
 *                             example: 200
 *                           transactionType:
 *                             type: string
 *                             enum: [CREDIT, DEBIT]
 *                             example: CREDIT
 *                           description:
 *                             type: string
 *                             example: "Added funds from UPI"
 *                           referenceId:
 *                             type: string
 *                             example: "upi_abc_123"
 *                           balanceBefore:
 *                             type: number
 *                             example: 300.75
 *                           balanceAfter:
 *                             type: number
 *                             example: 500.75
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-31T10:15:00Z"
 *       "401":
 *         description: Unauthorized - User not authenticated
 *       "500":
 *         description: Server error while fetching wallet stats
 */
// * /api/v1/wallet/user GET
router.get("/user", userWalletStats);

/**
 * @openapi
 * /api/v1/wallet/driver:
 *   get:
 *     tags: [Driver]
 *     summary: Get Driver Wallet Stats
 *     description: Fetch the wallet details of a driver, including the last 10 wallet transactions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the driver whose wallet stats are being requested
 *     responses:
 *       "200":
 *         description: Successfully fetched driver wallet stats
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
 *                   example: Fetched Driver wallet stats successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "wallet_456"
 *                     userId:
 *                       type: string
 *                       example: "driver_123"
 *                     balance:
 *                       type: number
 *                       example: 1200.5
 *                     WalletTransaction:
 *                       type: array
 *                       description: Last 10 transactions of the driver wallet
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "txn_1001"
 *                           walletId:
 *                             type: string
 *                             example: "wallet_456"
 *                           amount:
 *                             type: number
 *                             example: 300
 *                           transactionType:
 *                             type: string
 *                             enum: [CREDIT, DEBIT]
 *                             example: DEBIT
 *                           description:
 *                             type: string
 *                             example: "Ride commission deduction"
 *                           referenceId:
 *                             type: string
 *                             example: "ride_789"
 *                           balanceBefore:
 *                             type: number
 *                             example: 1500.5
 *                           balanceAfter:
 *                             type: number
 *                             example: 1200.5
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-08-31T12:00:00Z"
 *       "400":
 *         description: Missing or invalid driverId
 *       "401":
 *         description: Unauthorized - User not authenticated
 *       "500":
 *         description: Server error while fetching driver wallet stats
 */
// * /api/v1/wallet/driver GET
router.get("/driver", driverWalletStats);

/**
 * @openapi
 * /api/v1/wallet/refund:
 *   post:
 *     tags: [Wallet]
 *     summary: Refund a payment
 *     description: Refunds a completed payment and updates the user's wallet balance and transactions.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - amount
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: "pay_123"
 *               amount:
 *                 type: number
 *                 example: 200
 *     responses:
 *       "200":
 *         description: Refund processed successfully
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
 *                   example: Refund successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       type: object
 *                       description: Updated payment record
 *                     refund:
 *                       type: object
 *                       description: Stripe refund details
 *       "400":
 *         description: Invalid refund amount or payment not eligible
 *       "404":
 *         description: Payment not found
 *       "500":
 *         description: Server error while processing refund
 */
// * /api/v1/wallet/refund POST
router.post("/refund", walletRefund);

export { router as walletRoutes };
