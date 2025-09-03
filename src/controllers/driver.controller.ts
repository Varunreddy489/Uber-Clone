import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  createDriverService,
  getAvailableDrivers,
  requestUpdateService,
  updateDriversLocation,
  vehicleRegisterService,
} from "../services";
import { logger, prisma } from "../config";
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

export const updateRequestController = async (req: Request, res: Response) => {
  try {
    const { rideRequestId } = req.params;
    const { status } = req.body;

    const response = await requestUpdateService(rideRequestId, status);

    // Todo: Send Notification to The Passenger about the status

    SuccessResponse.data = response;
    SuccessResponse.message = "Ride request status updated successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getDriverByIdController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { LicenseNumber } = req.body;

    const driver = await createDriverService(
      userId,
      LicenseNumber,
      req.files as any
    );

    // Todo: Send Notification to The Driver for Joining the Platform

    SuccessResponse.data = driver;
    SuccessResponse.message = "Driver created successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error.message || "Internal Server Error";
    logger.error("Error in createDriver:", error);
    res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ErrorResponse);
  }
};

export const toggleDriverStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { driverId } = req.params;
    const { isActive } = req.body;

    // Todo: Send Notification to The Driver About his status

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

    const vehicle = await vehicleRegisterService(
      driverId,
      {
        vehicleNo,
        vehicleType,
        company,
        model,
        seatCapacity: Number(seatCapacity),
      },
      req.files as any
    );

    // Todo: Send Notification to The Driver About his vehicle

    SuccessResponse.data = vehicle;
    SuccessResponse.message = "Vehicle registered successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in toggleDriverStatusController:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
