import { StatusCodes } from "http-status-codes";
import { logger, prisma } from "../config";
import {
  NearbyDriver,
  RideRequestTypes,
  UpdateReqStatus,
} from "../utils/common";
import AppError from "../utils/errors/app.error";
import { RideRequestStatus, RideStatus } from "../generated/prisma";

export const getDriversAvilableInUserProximity = async (
  userLat: number,
  userLng: number,
  radius: number
): Promise<NearbyDriver[]> => {
  try {
    const drivers = await prisma.$queryRaw<NearbyDriver[]>`
    SELECT * FROM (
      SELECT D.*, V."vehicleType", V."vehicleNo", V."seatCapacity", V."isActive", (
              6371 * acos(
                cos(radians(${userLat})) * 
                cos(radians(D.curr_lat)) * 
                cos(radians(D.curr_long) - radians(${userLng})) + 
                sin(radians(${userLat})) * 
                sin(radians(D.curr_lat))
              )
            ) AS distance
              FROM "Driver" D
          LEFT JOIN "vehicle" V ON D.id = V."driverId"
          WHERE 
            D."driverStatus" = 'AVAILABLE'
            AND D.curr_lat IS NOT NULL 
            AND D.curr_long IS NOT NULL
            AND V."isActive" = true
    ) AS drivers_with_distance
    WHERE distance <= ${radius}
    ORDER BY distance ASC
    `;

    return drivers;
  } catch (error: any) {
    logger.error("Error in getDriversAvilableInUserProximity:", error);

    throw new AppError(
      `Failed to find drivers within radius: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const requestRide = async (data: RideRequestTypes) => {
  try {
    const {
      userId,
      driverId,
      destination,
      userLocation,
      fare,
      distance,
      vehicleType,
    } = data;

    if (
      !userId ||
      !driverId ||
      !destination ||
      !userLocation ||
      !fare ||
      !distance ||
      !vehicleType
    ) {
      throw new AppError("Driver ID is required", StatusCodes.BAD_REQUEST);
    }

    const result = await prisma.rideRequest.create({
      data: {
        userId,
        driverId,
        userLocation,
        destination,
        fare,
        distance,
        vehicleType,
        status: RideRequestStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return result;
  } catch (error: any) {
    logger.error("Error in requestRide:", error);
    throw new AppError(
      `Failed to find drivers within radius: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateRideStatus = async (data: UpdateReqStatus) => {
  try {
    const { rideId,rideRequestId, status } = data;

    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
    });

    if (!ride) {
      throw new AppError("Ride not found", StatusCodes.NOT_FOUND);
    }

    let rideStatus;

    switch (status) {
      case RideRequestStatus.ACCEPTED:
        rideStatus = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: {
            status: RideRequestStatus.ACCEPTED,
          },
        });

        // update the acceptedAt column in ride table
        await prisma.ride.update({
          where: { id: rideId },
          data: {
            acceptedAt: new Date(),
          },
        });

        break;

      case RideRequestStatus.REJECTED:
        rideStatus = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: {
            status: RideRequestStatus.REJECTED,
          },
        });
        break;

      case RideRequestStatus.CANCELLED:
        rideStatus = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: {
            status: RideRequestStatus.CANCELLED,
          },
        });
        break;

      default:
        rideStatus = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: {
            status: RideRequestStatus.TIMED_OUT,
          },
        });
    }

    return rideStatus;
  } catch (error: any) {
    logger.error("Error in acceptRide:", error);
    throw new AppError(
      `Failed to find drivers within radius: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
