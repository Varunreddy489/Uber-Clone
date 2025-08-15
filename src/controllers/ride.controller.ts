import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  RideStatus,
  VehicleType,
  DriverStatus,
  RideRequestStatus,
} from "../generated/prisma";
import {
  requestRide,
  locationService,
  updateRideStatus,
  getDriversAvilableInUserProximity,
} from "../services";
import { logger, prisma } from "../config";
import { calculateDistance } from "../helper";
import AppError from "../utils/errors/app.error";
import { DriverRadius } from "../utils/constants";
import { calculateEstimatedFare } from "../helper/fareCalcuator";
import { ErrorResponse, SuccessResponse } from "../utils/common";

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

    // * Fetch all drivers location who are available and theyin the 5km range of the user

    nearByDrivers = await getDriversAvilableInUserProximity(
      userLocation.lat,
      userLocation.lng,
      DriverRadius
    );

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
      estimatedFare: calculateEstimatedFare(total_distance, driver.vehicleType),
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
    const data = { ...req.body, ...req.params };
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
 * 
 * @param req 
 * @param res 
 * @description Takes the driverId and status as params
 * @returns Saves the type of ride and save it in Db 
  PENDING
  ACCEPTED
  REJECTED
  TIMED_OUT
  CANCELLED
 * 
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
    const { userId, userLocation, destination } = req.body;

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

    console.log(driverDetails);

    // Calculate the estimated fare
    const fare = calculateEstimatedFare(
      distance,
      String(driverDetails?.vehicle?.vehicleType)
    );

    // ^ Create a Ride Between the user and driver
    const result = await prisma.$transaction(async (tx) => {
      // ^ 1.Requesting a ride from driver

      const existingAcceptedRequest = await prisma.rideRequest.findFirst({
        where: {
          driverId,
          status: RideRequestStatus.ACCEPTED,
        },
      });

      if (existingAcceptedRequest) {
        throw new AppError("Driver is not available", StatusCodes.BAD_REQUEST);
      }

      const ride = await tx.ride.create({
        data: {
          userId,
          driverId,
          curr_location: userLocation,
          destination,
          rideType: driverDetails?.vehicle?.vehicleType ?? VehicleType.ECONOMY,
          status: RideStatus.ACCEPTED,
          distance,
          fare,
          // rideRequestId: existingAcceptedRequest?.id,
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

// Todo: Send a notification to the user that the ride is completed with in x minutes

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
