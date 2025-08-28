import fs from "fs/promises";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  cloudinaryService,
  getAvailableDrivers,
  sendEmail,
  updateDriversLocation,
} from "../services";
import { logger, prisma, redisClient } from "../config";
import { ErrorResponse, SuccessResponse } from "../utils/common";

/**
 * Controller to update the location of a driver.
 * Updates the driver's location in the database and responds with the updated driver data.
 * Logs the updated driver location on success or an error message on failure.
 */
export const updateDriversLocationController = async (
  req: Request,
  res: Response
) => {
  try {
    const { driverId } = req.params;
    const { location } = req.body;

    const updatedDriver = await updateDriversLocation(driverId, location);

    if (!updatedDriver) {
      ErrorResponse.error = "Failed to update driver location";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    SuccessResponse.data = updatedDriver;
    logger.info(`updated ${driverId} location to ${updatedDriver}`);
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in updateDriversLocationController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const getAllAvailableDriversController = async (
  req: Request,
  res: Response
) => {
  try {
    const availableDrivers = await getAvailableDrivers();
    SuccessResponse.data = availableDrivers;
    logger.error("Available Drivers:", SuccessResponse.data);
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableDriversController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const getDriverByIdController = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      ErrorResponse.error = "Driver ID is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicle: {
          select: {
            id: true,
            vehicleType: true,
            vehicleNo: true,
            seatCapacity: true,
            isActive: true,
          },
        },
      },
    });

    if (!driver) {
      ErrorResponse.error = "Driver not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    SuccessResponse.data = driver;
    logger.error("Available Drivers:", SuccessResponse.data);
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getDriverByIdController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { LicenseNumber } = req.body;

    if (!userId) {
      ErrorResponse.error = "User ID is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    if (!LicenseNumber) {
      ErrorResponse.error = "License Number is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    if (!req.files) {
      ErrorResponse.error = "All fields are required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const licenseImage = files["LicenseImage"]?.[0];
    const govtProof = files["govt_proof"]?.[0];

    if (!licenseImage || !govtProof) {
      ErrorResponse.error = "All fields are required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const license_url = await cloudinaryService(licenseImage.path);
    const govt_url = await cloudinaryService(govtProof.path);

    await fs.unlink(licenseImage.path);
    await fs.unlink(govtProof.path);

    const driver = await prisma.driver.create({
      data: {
        userId,
        phone_number: user?.phone_number,
        LicenseNumber,
        LicenseImage: license_url,
        Proof: govt_url,
      },
    });

    const emailPayload = {
      toMail: user.email,
      subject: "We Received Your Application",
      body: `
      <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
      <p style="color: #666;">Hello ${user.name},</p>
        <p style="color: #333;">We Received Your Application.We will verify and approve your application soon.  </p>`,
    };

    await sendEmail(emailPayload);

    SuccessResponse.data = driver;
    logger.error("Driver created:", SuccessResponse.data);
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in createDriver:", error);
    console.error("Error in createDriver:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const toggleDriverStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { driverId } = req.params;
    const { isActive } = req.body;
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: { isActive },
    });
    SuccessResponse.data = updatedDriver;
    logger.error("Driver status updated:", SuccessResponse.data);
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in toggleDriverStatusController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        isActive: true,
      },
    });

    if (!driver) {
      ErrorResponse.error = "Driver not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    SuccessResponse.data = driver;
    logger.error("Driver status updated:", SuccessResponse.data);
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in toggleDriverStatusController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const registerVehicle = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { vehicleNo, vehicleType, company, model, seatCapacity } = req.body;

    if (!driverId) {
      ErrorResponse.error = "Driver ID is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      ErrorResponse.error = "Driver not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    if (!req.files) {
      ErrorResponse.error = "All fields are required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const vehicleImage = files["vehicleImage"]?.[0];

    if (!vehicleImage) {
      ErrorResponse.error = "All fields are required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const vehicleImage_url = await cloudinaryService(vehicleImage.path);

    await fs.unlink(vehicleImage.path);

    const updatedDriver = await prisma.vehicle.create({
      data: {
        driverId,
        vehicleNo,
        vehicleType,
        company,
        model,
        seatCapacity,
        vehicleImage: vehicleImage_url,
      },
    });

    SuccessResponse.data = updatedDriver;
    logger.error("Driver status updated:", SuccessResponse.data);
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in toggleDriverStatusController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
