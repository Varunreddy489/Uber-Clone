import { StatusCodes } from "http-status-codes";

import { logger, prisma } from "../config";
import { locationService } from "./location.service";
import AppError from "../utils/errors/app.error";
import { log } from "console";

export const updateDriversLocation = async (
  driverId: string,
  location: string
) => {
  try {
    const driverLocation = await locationService(location);

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        location: driverLocation.formatted_address,
        curr_lat: driverLocation.lat,
        curr_long: driverLocation.lng,
      },
    });

    logger.info(
      `Driver ${driverId} location updated: ${driverLocation.lat}, ${driverLocation.lng}`
    );
    return updatedDriver;
  } catch (error: any) {
    throw new AppError(
      `Failed to update driver location: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAvailableDrivers = async () => {
  try {
    const availableDrivers = await prisma.driver.findMany({
      where: {
        driverStatus: "AVAILABLE",
      },
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

    return availableDrivers;
  } catch (error: any) {
    throw new AppError(
      `Failed to get all available drivers: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};



