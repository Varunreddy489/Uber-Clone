import Stripe from "stripe";
import { StatusCodes } from "http-status-codes";

import {
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  TransactionType,
} from "../generated/prisma";
import AppError from "../utils/errors/app.error";
import { logger, prisma, serverConfig } from "../config";
import { notificationMessages } from "../utils/constants";
import { createNotification } from "./notification.service";

const stripe = new Stripe(serverConfig.STRIPE_SECRET_KEY);

export const paymentService = async (
  driverId: string,
  userId: string,
  rideId: string
) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate required parameters
      if (!driverId || !userId || !rideId) {
        throw new AppError(
          "Driver ID, User ID and Ride ID are required",
          StatusCodes.BAD_REQUEST
        );
      }

      // 2. Fetch entities
      const [user, driver, ride, userWallet, driverWallet] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.driver.findUnique({ where: { id: driverId } }),
        tx.ride.findUnique({ where: { id: rideId } }),
        tx.wallet.findUnique({ where: { userId } }),
        tx.wallet.findUnique({ where: { userId: driverId } }),
      ]);

      // 3. Validate all entities exist
      if (!user) throw new AppError("User not found", StatusCodes.BAD_REQUEST);
      if (!driver)
        throw new AppError("Driver not found", StatusCodes.BAD_REQUEST);
      if (!ride) throw new AppError("Ride not found", StatusCodes.BAD_REQUEST);

      if (!userWallet)
        throw new AppError("User wallet not found", StatusCodes.BAD_REQUEST);

      if (!driverWallet) {
        await tx.wallet.create({
          data: {
            userId: driverId,
            balance: 0,
          },
        });
      }

      // 4. Check if the user has enough balance
      if (Number(userWallet.balance) < Number(ride.totalFare)) {
        throw new AppError("Insufficient balance", StatusCodes.BAD_REQUEST);
      }

      // 5. Get the Admin wallet

      const adminId = serverConfig.ADMIN_ID;

      if (!adminId) {
        throw new AppError("Admin wallet not found", StatusCodes.BAD_REQUEST);
      }

      const adminWallet = await tx.wallet.findUnique({
        where: { userId: adminId },
      });

      if (!adminWallet) {
        await tx.wallet.create({
          data: { userId: adminId, balance: 0 },
        });
      }

      // 6. Calculate the commission split for admin and driver
      const totalAmount = Number(ride.totalFare);
      const adminCommission = totalAmount * 0.2;
      const driverCommission = totalAmount * 0.8;

      // 7. Create a payment record for admin and driver
      const payment = await tx.payment.create({
        data: {
          userId: userId,
          rideId: rideId,
          amount: totalAmount,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.WALLET,
        },
      });

      // 8. Deduct the amount from the user's wallet
      const newUserBalance =
        Number(userWallet.balance) - Number(ride.totalFare);

      const updatedUserWallet = await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: newUserBalance },
      });

      // 9. Create user wallet transaction

      await tx.walletTransaction.create({
        data: {
          walletId: updatedUserWallet.id,
          amount: Number(ride.totalFare),
          transactionType: TransactionType.DEBIT,
          description: `Payment for ride ${rideId}`,
          referenceId: payment.id,
          parentPaymentId: payment.id,
          balanceBefore: userWallet.balance,
          balanceAfter: updatedUserWallet.balance,
        },
      });

      // 10. Credit driver wallet with 80% of total fare

      const newDriverBalance =
        Number(driverWallet?.balance) + Number(driverCommission);

      const updatedDriverWallet = await tx.wallet.update({
        where: { id: driverWallet?.id },
        data: { balance: newDriverBalance },
      });

      // 11. Create driver wallet transaction

      await tx.walletTransaction.create({
        data: {
          walletId: updatedDriverWallet.id,
          amount: driverCommission,
          transactionType: TransactionType.CREDIT,
          description: `Commission for ride ${rideId}`,
          referenceId: payment.id,
          parentPaymentId: payment.id,
          balanceBefore: Number(driverWallet?.balance),
          balanceAfter: updatedDriverWallet.balance,
        },
      });

      // 12. Credit admin wallet with 20% commission
      const newAdminBalance = Number(adminWallet?.balance) + adminCommission;

      await tx.wallet.update({
        where: { id: adminWallet?.id },
        data: { balance: newAdminBalance },
      });

      // 13. Create admin wallet transaction (CREDIT)
      await tx.walletTransaction.create({
        data: {
          walletId: adminWallet!.id,
          amount: adminCommission,
          transactionType: TransactionType.CREDIT,
          description: `Platform commission for ride ${rideId} (20% of total fare)`,
          referenceId: `RIDE_${rideId}_ADMIN_COMMISSION`,
          parentPaymentId: payment.id,
          balanceBefore: Number(adminWallet?.balance),
          balanceAfter: newAdminBalance,
        },
      });

      const completedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          gatewayTxnId: `WALLET_TXN_${payment.id}`,
          gatewayResponse: {
            success: true,
            totalAmount: totalAmount,
            driverEarnings: driverCommission,
            adminCommission: adminCommission,
            userBalanceAfter: newUserBalance,
            driverBalanceAfter: newDriverBalance,
            adminBalanceAfter: newAdminBalance,
            timestamp: new Date().toISOString(),
          },
        },
      });

      const userNotificationData = {
        userId: userId,
        title: notificationMessages.USER_PAYMENT_SUCCESS_NO(totalAmount).title,
        message:
          notificationMessages.USER_PAYMENT_SUCCESS_NO(totalAmount).message,
        category: NotificationType.PAYMENT_SUCCESSFUL,
      };

      const driverNotificationData = {
        userId: driverId,
        title:
          notificationMessages.DRIVER_PAYMENT_SUCCESS_NO(driverCommission)
            .title,
        message:
          notificationMessages.DRIVER_PAYMENT_SUCCESS_NO(driverCommission)
            .message,
        category: NotificationType.PAYMENT_SUCCESSFUL,
      };

      // User Notification
      await createNotification(userNotificationData);

      // Driver Notification
      await createNotification(driverNotificationData);

      return {
        payment: completedPayment,
        userBalanceAfter: newUserBalance,
        driverEarnings: driverCommission,
        adminCommission: adminCommission,
        totalAmount: totalAmount,
      };
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in paymentService:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const createStripeIntent = async (userId: string, amount: number) => {
  try {
    const isUser = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { Wallet: true },
      }),
    ]);

    if (!isUser) throw new AppError("User not found", StatusCodes.NOT_FOUND);

    console.log(isUser);

    if (!isUser[0]?.Wallet) {
      await prisma.wallet.create({
        data: { userId: userId, balance: 0 },
      });
    }

    if (amount <= 0 || amount >= 10000) {
      throw new AppError(
        "Amount must be between 0 and 10,000",
        StatusCodes.BAD_REQUEST
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        walletId: isUser[0]?.Wallet?.id ?? "null", // always string
        userId: userId,
        type: "wallet_topup",
      },
      description: `Wallet top-up for user ${userId}`,
    });

    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        amount: amount,
        rideId: "Wallet Top-up",
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        gatewayTxnId: paymentIntent.id,
        gatewayResponse: paymentIntent as any,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      amount: amount,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in stripePaymentService:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const handlePaymentSuccess = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new AppError("Payment not successful", StatusCodes.BAD_REQUEST);
    }

    const { walletId, userId } = paymentIntent.metadata;

    const amount = paymentIntent.amount ? paymentIntent.amount / 100 : 0;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new AppError("Wallet not found", StatusCodes.NOT_FOUND);
      }

      const balanceBefore = wallet.balance;
      const newBalance = Number(balanceBefore) + amount;

      const updatedWallet = await tx.wallet.update({
        where: {
          id: walletId,
        },
        data: {
          balance: newBalance,
        },
      });

      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: walletId,
          amount: amount,
          transactionType: TransactionType.CREDIT,
          description: `Wallet top-up via Stripe`,
          referenceId: paymentIntent.id,
          balanceBefore: balanceBefore,
          balanceAfter: updatedWallet.balance,
        },
      });

      await tx.payment.update({
        where: {
          gatewayTxnId: paymentIntent.id,
        },
        data: {
          status: PaymentStatus.COMPLETED,
          gatewayResponse: paymentIntent as any,
        },
      });
      return {
        wallet: updatedWallet,
        transaction: walletTransaction,
      };
    });

    const notificationData = {
      userId: userId,
      title: notificationMessages.WALLET_TOPUP_SUCCESS(amount).title,
      message: notificationMessages.WALLET_TOPUP_SUCCESS(amount).message,
      category: NotificationType.RIDE_REQUEST,
    };

    await createNotification(notificationData);

    logger.info(
      `Wallet ${walletId} topped up with $${amount}  for user ${userId} via Stripe`
    );

    return result;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in handlePaymentSuccess:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const handlePaymentFailure = async (
  paymentIntentId: string,
  failureReason?: string
) => {
  try {
    await prisma.payment.update({
      where: {
        gatewayTxnId: paymentIntentId,
      },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: failureReason || "Payment failed",
      },
    });

    logger.info(`Payment ${paymentIntentId} marked as failed`);
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in handlePaymentFailure:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getUserWallet = async (userId: string) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        WalletTransaction: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      const newWallet = await prisma.wallet.create({
        data: {
          userId: userId,
          balance: 0,
        },
        include: {
          WalletTransaction: true,
        },
      });
      return newWallet;
    }

    return wallet;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in getUserWallet:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getDriverWallet = async (driverId: string) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: driverId },
      include: {
        WalletTransaction: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      const newWallet = await prisma.wallet.create({
        data: {
          userId: driverId,
          balance: 0,
        },
        include: {
          WalletTransaction: true,
        },
      });
      return newWallet;
    }

    return wallet;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in getDriverTransactions:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const handleStripeWebhook = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if (paymentIntent.metadata.type === "wallet_topup") {
          await handlePaymentSuccess(paymentIntent.id);
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;

        if (failedPayment.metadata.type === "wallet_topup") {
          await handlePaymentFailure(
            failedPayment.id,
            failedPayment.last_payment_error?.message
          );
        }
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in stripePaymentService:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const refundWalletTransaction = async (
  paymentId: string,
  refundAmount: number
) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: { include: { Wallet: true } } },
    });

    if (!payment) {
      throw new AppError("Payment not found", StatusCodes.NOT_FOUND);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new AppError(
        "Only completed payments can be refunded",
        StatusCodes.BAD_REQUEST
      );
    }

    const amountToRefund = refundAmount || Number(payment.amount);

    if (amountToRefund <= 0 || amountToRefund > Number(payment.amount)) {
      throw new AppError("Invalid refund amount", StatusCodes.BAD_REQUEST);
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.gatewayTxnId!,
      amount: Math.round(amountToRefund * 100), // Convert to cents
    });

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundAmount: amountToRefund,
          refundedAt: new Date(),
        },
      });

      if (payment.rideId !== "wallet-topup") {
        const wallet = payment.user.Wallet;
        const balanceBefore = wallet?.balance || 0;
        const newBalance = Number(balanceBefore) + amountToRefund;

        await tx.wallet.update({
          where: { id: wallet?.id },
          data: { balance: Math.max(0, newBalance) }, // Prevent negative balance
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            amount: amountToRefund,
            transactionType: TransactionType.DEBIT,
            description: `Refund for payment ${paymentId}`,

            referenceId: refund.id,
            balanceBefore: balanceBefore,
            balanceAfter: Math.max(0, newBalance),
          },
        });
      }
      return updatedPayment;
    });
    return { payment: result, refund };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Error in stripePaymentService:", error);
    throw new AppError(
      `Payment processing failed: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
