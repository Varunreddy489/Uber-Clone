import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { sendEmail } from "../services";
import { logger, prisma } from "../config";
import { UserRoles } from "../generated/prisma";
import { ErrorResponse, SuccessResponse } from "../utils/common";

export const changeRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      ErrorResponse.error = "User ID is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const isUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!isUser) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const updatedUser = await prisma.roleChangeRequest.create({
      data: {
        userId: isUser.id,
        newRole: UserRoles.DRIVER,
      },
    });

    const emailPayload = {
      toMail: isUser.email,
      subject: "Role Change Request",
      body: `
      <h1>We Received Your Role Change Request</h1>
      <p> We Will verify and let you know </p>
      `,
    };
    await sendEmail(emailPayload);

    SuccessResponse.data = updatedUser;
    SuccessResponse.message = "Role changed successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in changeRole:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      ErrorResponse.error = "User ID is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone_number: true,
        gender: true,
        profileImage: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.NOT_FOUND).json(ErrorResponse);
      return;
    }

    const userRideData = await prisma.rideRequest.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        userLocation: true,
        destination: true,
        totalFare: true,
        distance: true,
        vehicleType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userRideData) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.NOT_FOUND).json(ErrorResponse);
      return;
    }

    SuccessResponse.data = {
      user,
      userRideData,
    };

    SuccessResponse.message = "User fetched successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getUserById:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
