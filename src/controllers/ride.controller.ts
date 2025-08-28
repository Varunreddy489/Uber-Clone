import { Server } from "socket.io";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  RideStatus,
  DriverStatus,
  RideRequestStatus,
  VehicleType,
} from "../generated/prisma";
import {
  requestRide,
  paymentService,
  locationService,
  updateRideStatus,
  calculateEstimatedFare,
  getDriversAvailableInUserProximity,
  getTimeService,
} from "../services";
import { logger, prisma } from "../config";
import { calculateDistance } from "../helper";
import AppError from "../utils/errors/app.error";
import { DriverRadius, VehicleFare } from "../utils/constants";
import { ErrorResponse, SuccessResponse } from "../utils/common";

let ioInstance: Server;

export const setSocketInstance = (io: Server) => {
  ioInstance = io;
};
export const getAllAvailableRides = async (req: Request, res: Response) => {
  const { location, destination } = req.params;

  try {
    let nearByDrivers = [];
    let radius = DriverRadius;

    if (!location) {
      ErrorResponse.error = "Location is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    // * Get the user location
    const userLocation = await locationService(location);
    const destCoord = await locationService(destination);

    logger.info(`Found destination co-ord ${destCoord.lat}`);

    // * Fetch all drivers location who are available and they are in the 5km range of the user

    const driversResult = await getDriversAvailableInUserProximity(
      userLocation.lat,
      userLocation.lng,
      DriverRadius
    );

    nearByDrivers = driversResult.drivers;

    const total_distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      destCoord.lat,
      destCoord.lng
    );

    console.log(nearByDrivers);

    const availableRides = nearByDrivers.map((driver: any) => ({
      driverId: driver.id,
      driverName: driver.name,
      vehicleType: driver.vehicleType,
      phone_number: driver.phone_number,
      rating: driver.rating,
      isActive: driver.isActive,
      distance: driver.distance.toFixed(2),
      total_distance: total_distance,
      estimatedFare: calculateEstimatedFare(
        total_distance,
        driver.vehicleType,
        userLocation.lat,
        userLocation.lng
      ),
      location: {
        location: driver.location,
        curr_lat: driver.curr_lat,
        curr_long: driver.curr_long,
      },
    }));

    console.log(availableRides);

    SuccessResponse.data = availableRides;
    logger.info(`Found ${availableRides} rides within 5km`);
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const requestRideController = async (req: Request, res: Response) => {
  try {
    const { userId, destination, userLocation, fare, vehicleType } = req.body;

    const userLocationCoord = await locationService(userLocation);
    const destinationCoord = await locationService(destination);

    const distance = calculateDistance(
      userLocationCoord.lat,
      userLocationCoord.lng,
      destinationCoord.lat,
      destinationCoord.lng
    );

    const data = { ...req.body, distance, userLocationCoord, ...req.params };

    const response = await requestRide(data);

    // Notify the specific driver about the ride request
    if (ioInstance && data.driverId) {
      ioInstance.emit(`rideRequest-${data.driverId}`, {
        type: "NEW_RIDE_REQUEST",
        rideId: response.id,
        userId: data.userId,
        userLocation: data.userLocation,
        destination: data.destination,
        // fare: response.fare,
        pickupLocation: data.userLocation,
        timestamp: new Date(),
      });

      logger.info(`Ride request notification sent to driver ${data.driverId}`);
    }

    // Notify the user that request has been sent
    if (ioInstance && data.userId) {
      ioInstance.emit(`user-${data.userId}`, {
        type: "RIDE_REQUEST_SENT",
        message: "Your ride request has been sent to the driver",
        rideId: response.id,
        status: "PENDING",
      });
    }

    SuccessResponse.data = response;
    SuccessResponse.message = "Ride requested successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

/**
  @description Takes the driverId and status as params
  @returns Saves the type of ride and save it in Db 
  PENDING
  ACCEPTED
  REJECTED
  TIMED_OUT
  CANCELLED
 */
export const updateRideRequestStatus = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body, ...req.params };

    const response = await updateRideStatus(data);

    // Todo : Notify Users using websockets

    SuccessResponse.data = response;
    SuccessResponse.message = `Ride status updated successfully to ${req.body.status} `;
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const createRide = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { userId, vehicleId, userLocation, destination } = req.body;

    // Validation
    if (!driverId || !userId || !destination || !userLocation) {
      ErrorResponse.error = "Missing required fields";
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
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
      ErrorResponse.error = "Driver not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    if (driverDetails.driverStatus !== DriverStatus.AVAILABLE) {
      ErrorResponse.error = "Driver is not available";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    if (!driverDetails.vehicle?.vehicleType) {
      ErrorResponse.error = "Driver has no vehicle";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const vehicleType = driverDetails?.vehicle?.vehicleType;

    // Calculate the estimated fare
    const fare = calculateEstimatedFare(
      distance,
      String(driverDetails?.vehicle?.vehicleType),
      user_address.lat,
      user_address.lng
    );

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
          distanceFare: distance * baseFareRate,
          timeFare: existingAcceptedRequest.timeFare,
          surgeFare: existingAcceptedRequest.surgeFare,
          totalFare: existingAcceptedRequest.totalFare,
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

    // Todo Notify Driver using websockets

    SuccessResponse.data = result;
    SuccessResponse.message = "Ride accepted";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in getAllAvailableRides:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const completedRide = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;

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

    // TodoIncrement the count of rides,earnings,distance and time for the driver

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

    // Todo: Make payment to the driver
    const userId = driverData.user.id;

    await paymentService(driverId, userId, rideId);

    SuccessResponse.data = response;
    SuccessResponse.message = "Ride completed successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in completedRide):", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const pickupController = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;
    const response = await prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.IN_PROGRESS, pickupTime: new Date() },
    });

    SuccessResponse.data = response;
    SuccessResponse.message = "Ride started successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in completedRide):", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
