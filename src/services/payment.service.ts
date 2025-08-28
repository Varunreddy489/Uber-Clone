import { StatusCodes } from "http-status-codes";

import {
  PaymentMethod,
  PaymentStatus,
  TransactionType,
} from "../generated/prisma";
import AppError from "../utils/errors/app.error";
import { logger, prisma, serverConfig } from "../config";

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

      return {
        payment: completedPayment,
        userBalanceAfter: newUserBalance,
        driverEarnings: driverCommission,
        adminCommission: adminCommission,
        totalProcessed: totalAmount,
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
