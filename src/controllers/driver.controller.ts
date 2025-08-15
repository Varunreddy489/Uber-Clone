import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { logger } from "../config";
import { ErrorResponse, SuccessResponse } from "../utils/common";
import { getAvailableDrivers, updateDriversLocation } from "../services";

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
