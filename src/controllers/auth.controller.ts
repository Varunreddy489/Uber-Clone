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
import { NotificationType } from "../generated/prisma";
import { notificationMessages } from "../utils/constants";
import { ErrorResponse, SuccessResponse } from "../utils/common";
import { createNotification } from "../services/notification.service";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { user, accessToken } = await userRegisterService(res, req.body);

    const data = {
      userId: user.id,
      title: notificationMessages.USER_REGISTERED(user.name).title,
      message: notificationMessages.USER_REGISTERED(user.name).message,
      category: NotificationType.REGISTRATION_SUCCESS,
    };
    // Create a notification for successful registration
    await createNotification(data);

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

    const data = {
      userId: user.id,
      title: notificationMessages.LOGIN_SUCCESSFUL().title,
      message: notificationMessages.LOGIN_SUCCESSFUL().message,
      category: NotificationType.REGISTRATION_SUCCESS,
    };
    // Create a notification for successful registration
    await createNotification(data);

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
    const userId = req.user.userId;
    const { email } = req.body;

    forgotPasswordService(email);

    const data = {
      userId: userId,
      title: notificationMessages.FORGOT_PASSWORD().title,
      message: notificationMessages.FORGOT_PASSWORD().message,
      category: NotificationType.REGISTRATION_SUCCESS,
    };
    // Create a notification for successful registration
    await createNotification(data);

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

    const data = {
      userId: userId,
      title: notificationMessages.OTP_VERIFIED().title,
      message: notificationMessages.OTP_VERIFIED().message,
      category: NotificationType.REGISTRATION_SUCCESS,
    };
    // Create a notification for successful registration
    await createNotification(data);

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

    const mailData = {
      userId: userId,
      title: notificationMessages.PASSWORD_RESET().title,
      message: notificationMessages.PASSWORD_RESET().message,
      category: NotificationType.REGISTRATION_SUCCESS,
    };
    // Create a notification for successful registration
    await createNotification(mailData);

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
