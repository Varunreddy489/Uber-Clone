import { StatusCodes } from "http-status-codes";

import {
  RideStatus,
  VehicleType,
  DriverStatus,
  RideRequestStatus,
  NotificationType,
} from "../generated/prisma";
import { logger, prisma } from "../config";
import { calculateDistance } from "../helper";
import AppError from "../utils/errors/app.error";
import { paymentService } from "./payment.service";
import { calculateEstimatedFare } from "./fare.service";
import { createNotification } from "./notification.service";
import { RideRequestTypes, UpdateReqStatus } from "../utils/common";
import { getTimeService, locationService } from "./location.service";
import { notificationMessages, VehicleFare } from "../utils/constants";

export const createRideService = async (data: any) => {
  try {
    const { driverId, userId, vehicleId, userLocation, destination } = data;

    if (!driverId || !userId || !destination || !userLocation) {
      throw new AppError("Driver ID is required", StatusCodes.BAD_REQUEST);
    }

    //  Getting the location of user current location and destination
    const user_address = await locationService(userLocation);
    const user_destination = await locationService(destination);

    // Calculating distance between user current location and destination
    const distance = calculateDistance(
      user_address.lat,
      user_address.lng,
      user_destination.lat,
      user_destination.lng
    );

    const driverDetails = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicle: true,
      },
    });

    if (!driverDetails) {
      throw new AppError("Driver ID is required", StatusCodes.BAD_REQUEST);
    }

    if (driverDetails.driverStatus !== DriverStatus.AVAILABLE) {
      throw new AppError("Driver ID is required", StatusCodes.BAD_REQUEST);
    }

    if (!driverDetails.vehicle?.vehicleType) {
      throw new AppError("Driver ID is required", StatusCodes.BAD_REQUEST);
    }

    const vehicleType = driverDetails?.vehicle?.vehicleType;

    // Calculate the estimated time
    const estimatedRideTime = getTimeService(userLocation, destination);

    // ^ Create a Ride Between the user and driver
    const result = await prisma.$transaction(async (tx) => {
      // ^ 1.Requesting a ride from driver

      const existingAcceptedRequest = await prisma.rideRequest.findFirst({
        where: {
          driverId,
          status: RideRequestStatus.ACCEPTED,
        },
      });

      if (!existingAcceptedRequest) {
        throw new AppError("Driver is not available", StatusCodes.BAD_REQUEST);
      }

      const baseFareRate =
        VehicleFare[vehicleType as keyof typeof VehicleFare] ||
        VehicleFare.ECONOMY;

      const estimatedFare = await calculateEstimatedFare(
        distance,
        vehicleType,
        user_address.lat,
        user_address.lng
      );

      const ride = await tx.ride.create({
        data: {
          userId,
          driverId,
          vehicleId,
          pickupLocation: userLocation,
          pickupLatitude: user_address.lat,
          pickupLongitude: user_address.lng,
          destinationAddress: destination,
          destinationLat: user_destination.lat,
          destinationLong: user_destination.lng,
          rideType: driverDetails?.vehicle?.vehicleType ?? VehicleType.ECONOMY,
          status: RideStatus.ACCEPTED,
          estimatedDistance: distance,
          actualDistance: distance,
          estimatedDuration: String(estimatedRideTime),
          baseFare: baseFareRate,
          distanceFare: estimatedFare.distanceFare,
          timeFare: estimatedFare.surgeCharges.time,
          surgeFare:
            estimatedFare.surgeCharges.weather +
            estimatedFare.surgeCharges.demand,
          totalFare: estimatedFare.totalFare,
        },
        include: {
          driver: {
            include: { vehicle: true },
          },
          user: true,
        },
      });

      await tx.driver.update({
        where: { id: driverId },
        data: { driverStatus: DriverStatus.UNAVAILABLE },
      });

      return ride;
    });

    return result;
  } catch (error: any) {
    logger.error("Error in createRideService:", error);
    throw new AppError(
      `Error in createRideService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getDriversAvailableInUserProximity = async (
  userLat: number,
  userLng: number,
  radius: number
) => {
  try {
    // const nearByDrivers = (await redisClient.georadius(
    //   "drivers:locations",
    //   userLng,
    //   userLat,
    //   radius,
    //   "km",
    //   "WITHDIST"
    // )) as [string, string][];

    // if (nearByDrivers.length === 0) {
    //   return { drivers: [], count: 0 };
    // }

    // // Map into typed objects
    // const nearbyDriversTyped = nearByDrivers.map(([member, distance]) => ({
    //   member,
    //   distance: parseFloat(distance),
    // }));

    // const driverIds = nearbyDriversTyped.map((d) => d.member);

    // const drivers = await prisma.driver.findMany({
    //   where: {
    //     id: {
    //       in: driverIds,
    //     },
    //     driverStatus: "AVAILABLE",
    //     isActive: true,
    //   },
    //   include: {
    //     vehicle: true,
    //   },
    // });

    // const driversWithDistance = drivers.map((driver) => {
    //   const redisData = nearbyDriversTyped.find((d) => d.member === driver.id);
    //   return {
    //     ...driver,
    //     distance: redisData?.distance ?? null,
    //   };
    // });

    // // Sort by distance (closest first)
    // const sortedDrivers = driversWithDistance.sort(
    //   (a, b) => (a.distance ?? 0) - (b.distance ?? 0)
    // );

    // // Todo: Add Sorting by Rating

    // return {
    //   drivers: sortedDrivers,
    //   count: sortedDrivers.length,
    // };
    return 1 as any;
  } catch (error: any) {
    logger.error("Error in getDriversAvailableInUserProximity:", error);

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
    const users = []; // await redisClient.georadius(
    // const users = await redisClient.georadius(
    //   "users:locations",
    //   longitude,
    //   latitude,
    //   radius,
    //   "km"
    // );

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

    // await redisClient.geoadd(
    //   "users:locations",
    //   userLocationCoord.lng,
    //   userLocationCoord.lat,
    //   userId
    // );

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

    const notificationData = {
      userId: driverId,
      title: notificationMessages.RIDE_REQUESTED(
        distance,
        fareDetails.totalFare,
        destination,
        userLocation
      ).title,
      message: notificationMessages.RIDE_REQUESTED(
        distance,
        fareDetails.totalFare,
        destination,
        userLocation
      ).message,
      category: NotificationType.RIDE_REQUEST,
    };

    await createNotification(notificationData);

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

    const driver = await prisma.driver.findUnique({
      where: { id: ride.driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new AppError("Driver not found", StatusCodes.NOT_FOUND);
    }

    let rideStatus;
    let notification: { title: string; message: string } | null = null;
    let notificationData;

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

        // * Send Notification
        notification = notificationMessages.RIDE_ACCEPTED(driver.user.name);

        notificationData = {
          userId: driver.user.id,
          title: notification.title,
          message: notification.message,
          category: NotificationType.RIDE_ACCEPTED,
        };

        await createNotification(notificationData);

        break;

      case RideRequestStatus.REJECTED:
        rideStatus = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: {
            status: RideRequestStatus.REJECTED,
          },
        });

        // * Send Notification
        notification = notificationMessages.RIDE_REJECTED();

        notificationData = {
          userId: driver.user.id,
          title: notification.title,
          message: notification.message,
          category: NotificationType.RIDE_CANCELED,
        };

        await createNotification(notificationData);

        break;

      case RideRequestStatus.CANCELLED:
        rideStatus = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: {
            status: RideRequestStatus.CANCELLED,
          },
        });

        // * Send Notification
        notification = notificationMessages.RIDE_CANCELED();

        notificationData = {
          userId: driver.user.id,
          title: notification.title,
          message: notification.message,
          category: NotificationType.RIDE_CANCELED,
        };

        await createNotification(notificationData);

        break;

      default:
        rideStatus = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: {
            status: RideRequestStatus.TIMED_OUT,
          },
        });

        // * Send Notification
        notification = notificationMessages.RIDE_TIMEOUT();

        notificationData = {
          userId: driver.user.id,
          title: notification.title,
          message: notification.message,
          category: NotificationType.RIDE_CANCELED,
        };

        await createNotification(notificationData);
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

export const rideCompletionService = async (data: any) => {
  try {
    const { rideId } = data;

    const response = await prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.COMPLETED, dropTime: new Date() },
    });

    if (!response.pickupTime || !response.dropTime) {
      throw new AppError(
        "Ride start or end time is missing",
        StatusCodes.BAD_REQUEST
      );
    }

    const duration = Math.round(
      response?.pickupTime.getTime() - response.pickupTime.getTime() / 1000 / 60
    );

    await prisma.ride.update({
      where: { id: rideId },
      data: { duration: duration },
    });

    const driverData = await prisma.ride.findUnique({
      where: { id: rideId },

      include: {
        driver: {
          select: {
            total_time: true,
            total_distance: true,
            total_earnings: true,
            total_rides: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!driverData) {
      throw new AppError("Driver not found", StatusCodes.BAD_REQUEST);
    }

    const driverId = driverData.driverId;

    // Increment the count of rides,earnings,distance and time for the driver
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        driverStatus: DriverStatus.AVAILABLE,
        total_time: driverData.driver.total_time + duration,
        total_distance:
          driverData.driver.total_distance + response.estimatedDistance,
        total_earnings: driverData.driver.total_earnings + response.totalFare,
        total_rides: driverData.driver.total_rides + 1,
      },
    });

    // Make payment to the driver
    const userId = driverData.user.id;
    await paymentService(driverId, userId, rideId);

    return response;
  } catch (error: any) {
    logger.error("Error in rideCompletionService:", error);
    throw new AppError(
      `Error in rideCompletionService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
