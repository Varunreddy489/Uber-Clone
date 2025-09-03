import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  getUserWallet,
  getDriverWallet,
  createStripeIntent,
  handlePaymentSuccess,
  refundWalletTransaction,
} from "../services";
import { logger } from "../config";
import { ErrorResponse, SuccessResponse } from "../utils/common";

export const createWalletTopUpIntent = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    const userId = req.user?.userId as string;

    const result = await createStripeIntent(userId, amount);

    SuccessResponse.data = result;
    SuccessResponse.message = "Stripe intent created successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in createWalletTopUpIntent:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const walletTopUpSuccess = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      ErrorResponse.message = "Payment Intent ID is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const result = await handlePaymentSuccess(paymentIntentId);

    SuccessResponse.data = result;
    SuccessResponse.message = "Wallet top-up successful";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in walletTopUpSuccess:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const userWalletStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string;

    const result = await getUserWallet(userId);

    SuccessResponse.data = result;
    SuccessResponse.message = "Fetching user wallet stats successful";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in userWalletStats:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const driverWalletStats = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;

    const result = await getDriverWallet(driverId);

    SuccessResponse.data = result;
    SuccessResponse.message = "Fetched Driver wallet stats successful";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in driverWalletStats:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const walletRefund = async (req: Request, res: Response) => {
  try {
    const { paymentId, amount } = req.body;

    const result = await refundWalletTransaction(paymentId, amount);

    SuccessResponse.data = result;
    SuccessResponse.message = "Refund successful";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in walletRefund:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
