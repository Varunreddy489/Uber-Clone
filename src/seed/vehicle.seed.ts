import { StatusCodes } from "http-status-codes";
import { logger, prisma } from "../config";
import AppError from "../utils/errors/app.error";
import {
  genUserId,
  genVehicleType,
  genVehicleNo,
  seatCapacity,
} from "../helper";

export const vehicleSeed = async () => {
  try {
    const drivers = await prisma.driver.findMany({ select: { id: true } });

    const vehicles = drivers.map((driver) => ({
      driverId: driver.id,
      vehicleType: genVehicleType(),
      vehicleNo: String(genVehicleNo()),
      seatCapacity: seatCapacity(),
    }));

    const result = await prisma.vehicle.createMany({
      data: vehicles,
      skipDuplicates: true,
    });

    logger.info(`Seeded ${result.count} Vehicles`);
    console.log(`Seeded ${result.count} Vehicles`);
  } catch (error: any) {
    logger.error("Error seeding drivers:", error);
    console.error("Error seeding drivers:", error);
    throw new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

vehicleSeed();
