import { Server } from "socket.io";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  requestRide,
  locationService,
  updateRideStatus,
  createRideService,
  createRatingService,
  calculateEstimatedFare,
  getDriversAvailableInUserProximity,
  rideCompletionService,
  createNotification,
} from "../services";
import { logger, prisma } from "../config";
import { calculateDistance } from "../helper";
import AppError from "../utils/errors/app.error";
import { DriverRadius, notificationMessages } from "../utils/constants";
import {
  RideStatus,
  DriverStatus,
  NotificationType,
} from "../generated/prisma";
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
    const { destination, userLocation } = req.body;

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

    SuccessResponse.data = response;
    SuccessResponse.message = `Ride status updated successfully to ${req.body.status} `;
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in updateRideRequestStatus:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const createRide = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const data = { driverId, ...req.body };

    const result = await createRideService(data);

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

    const response = await rideCompletionService(rideId);

    SuccessResponse.data = response;
    SuccessResponse.message = "Ride completed successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
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

    const notificationData = {
      userId: response.userId,
      title: notificationMessages.RIDE_STARTED(response.destinationAddress)
        .title,
      message: notificationMessages.RIDE_STARTED(response.destinationAddress)
        .message,
      category: NotificationType.RIDE_STARTED,
    };

    await createNotification(notificationData);

    SuccessResponse.data = response;
    SuccessResponse.message = "Ride started successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);

    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in completedRide):", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};

export const createRideRating = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body, ...req.params };

    const response = await createRatingService(data);

    SuccessResponse.data = response;
    SuccessResponse.message = "Rating created successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in completedRide):", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};
