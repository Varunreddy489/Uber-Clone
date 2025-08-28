import { StatusCodes } from "http-status-codes";

import AppError from "../utils/errors/app.error";
import { RideRequestStatus } from "../generated/prisma";
import { logger, prisma, redisClient } from "../config";
import { RideRequestTypes, UpdateReqStatus } from "../utils/common";
import { calculateEstimatedFare } from "./fare.service";

// export const getDriversAvailableInUserProximity = async (
//   userLat: number,
//   userLng: number,
//   radius: number
// ): Promise<NearbyDriver[]> => {
//   try {
//     const drivers = await prisma.$queryRaw<NearbyDriver[]>`
//     SELECT * FROM (
//       SELECT D.*, V."vehicleType", V."vehicleNo", V."seatCapacity", V."isActive", (
//               6371 * acos(
//                 cos(radians(${userLat})) *
//                 cos(radians(D.curr_lat)) *
//                 cos(radians(D.curr_long) - radians(${userLng})) +
//                 sin(radians(${userLat})) *
//                 sin(radians(D.curr_lat))
//               )
//             ) AS distance
//               FROM "Driver" D
//           LEFT JOIN "vehicle" V ON D.id = V."driverId"
//           WHERE
//             D."driverStatus" = 'AVAILABLE'
//             AND D.curr_lat IS NOT NULL
//             AND D.curr_long IS NOT NULL
//             AND V."isActive" = true
//     ) AS drivers_with_distance
//     WHERE distance <= ${radius}
//     ORDER BY distance ASC
//     `;

//     return drivers;
//   } catch (error: any) {
//     logger.error("Error in getDriversAvailableInUserProximity:", error);

//     throw new AppError(
//       `Failed to find drivers within radius: ${error.message}`,
//       StatusCodes.INTERNAL_SERVER_ERROR
//     );
//   }
// };

export const getDriversAvailableInUserProximity = async (
  userLat: number,
  userLng: number,
  radius: number
) => {
  try {
    const nearByDrivers = (await redisClient.georadius(
      "drivers:locations",
      userLng,
      userLat,
      radius,
      "km",
      "WITHDIST"
    )) as [string, string][];

    if (nearByDrivers.length === 0) {
      return { drivers: [], count: 0 };
    }

    // Map into typed objects
    const nearbyDriversTyped = nearByDrivers.map(([member, distance]) => ({
      member,
      distance: parseFloat(distance),
    }));

    const driverIds = nearbyDriversTyped.map((d) => d.member);

    const drivers = await prisma.driver.findMany({
      where: {
        id: {
          in: driverIds,
        },
        driverStatus: "AVAILABLE",
        isActive: true,
      },
      include: {
        vehicle: true,
      },
    });

    const driversWithDistance = drivers.map((driver) => {
      const redisData = nearbyDriversTyped.find((d) => d.member === driver.id);
      return {
        ...driver,
        distance: redisData?.distance ?? null,
      };
    });

    // Sort by distance (closest first)
    const sortedDrivers = driversWithDistance.sort(
      (a, b) => (a.distance ?? 0) - (b.distance ?? 0)
    );

    return {
      drivers: sortedDrivers,
      count: sortedDrivers.length,
    };
  } catch (error: any) {
    logger.error("Error i=n getDriversAvailableInUserProximity:", error);

    throw new AppError(
      `Failed to find drivers within radius: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
export const getActiveUsersInLocation = async (
  latitude: number,
  longitude: number,
  radius: number
) => {
  try {
    const users = await redisClient.georadius(
      "users:locations",
      longitude,
      latitude,
      radius,
      "km"
    );

    // const userIds = users.map((user: any) => user.member);
    // const userLat = users.map((user: any) => user.latitude);
    // const userLan = users.map((user: any) => user.longitude);

    // const userList = await prisma.user.findMany({
    //   where: {
    //     id: {
    //       in: userIds,
    //     },
    //     isOnline: true,
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     phone_number: true,

    //     gender: true,
    //     location: true,
    //   },
    // });

    // const data = { ...userList, userLat, userLan };

    return users.length;
  } catch (error: any) {
    logger.error("Error in getUsersInALocation:", error);

    throw new AppError(
      `Failed to find users within radius: ${error.message}`,
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
      userLocationCoord,
      distance,
      vehicleType,
    } = data;

    if (
      !userId ||
      !driverId ||
      !destination ||
      !userLocation ||
      !fare ||
      !userLocationCoord ||
      !distance ||
      !vehicleType
    ) {
      throw new AppError("Driver ID is required", StatusCodes.BAD_REQUEST);
    }

    const fareDetails = await calculateEstimatedFare(
      distance,
      vehicleType,
      userLocationCoord.lng,
      userLocationCoord.lat
    );

    await redisClient.geoadd(
      "users:locations",
      userLocationCoord.lng,
      userLocationCoord.lat,
      userId
    );

    const result = await prisma.rideRequest.create({
      data: {
        userId,
        driverId,
        userLocation,
        destination,
        baseFare: fareDetails.baseFare,
        distanceFare: fareDetails.distanceFare,
        timeFare: fareDetails.surgeCharges.time,
        surgeFare:
          fareDetails.surgeCharges.time +
          fareDetails.surgeCharges.weather +
          fareDetails.surgeCharges.demand,
        totalFare: fareDetails.totalFare,
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
    const { rideId, rideRequestId, status } = data;

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
