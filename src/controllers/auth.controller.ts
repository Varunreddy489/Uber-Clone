import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  userLoginService,
  userRegisterService,
  resetPasswordService,
  forgotPasswordService,
  otpVerificationService,
  resetUserPasswordService,
} from "../services";
import { logger } from "../config";
import { ErrorResponse, SuccessResponse } from "../utils/common";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { user, accessToken } = await userRegisterService(res, req.body);

    SuccessResponse.data = { user, accessToken };
    SuccessResponse.message = "User registered successfully";

    res.status(StatusCodes.CREATED).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    console.error(error);
    logger.error("Error in registerUser:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { user, accessToken } = await userLoginService(res, req.body);

    SuccessResponse.data = { user, accessToken };
    SuccessResponse.message = "User logged in successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in loginUser:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    SuccessResponse.message = "Logged out successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in logoutUser:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

//  Refreshes the access token using the provided refresh token.
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    const { accessToken } = await resetPasswordService(res, refreshToken);

    SuccessResponse.data = { accessToken };
    SuccessResponse.message = "Token refreshed successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in refreshToken:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    forgotPasswordService(email);

    SuccessResponse.message = "OTP sent successfully! Please Check your email";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { emailVerificationToken } = req.body;

    const user = await otpVerificationService(userId, emailVerificationToken);

    SuccessResponse.data = user;
    SuccessResponse.message = "OTP verified successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;

    const data = { userId, ...req.body };

    await resetUserPasswordService(data);

    SuccessResponse.message = "Password reset successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
