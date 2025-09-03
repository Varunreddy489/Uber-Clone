import { StatusCodes } from "http-status-codes";

import { logger, prisma } from "../config";
import { RatingData } from "../utils/common";
import AppError from "../utils/errors/app.error";

export const createRatingService = async (data: RatingData) => {
  try {
    const { rideId, driverId, userId, rating, comment } = data;

    const [isRide, isDriver, isUser] = await Promise.all([
      prisma.ride.findUnique({ where: { id: rideId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!isRide) throw new AppError("Ride not found", StatusCodes.NOT_FOUND);
    if (!isDriver)
      throw new AppError("Driver not found", StatusCodes.NOT_FOUND);
    if (!isUser) throw new AppError("User not found", StatusCodes.NOT_FOUND);

    const newRating = await prisma.driverRating.create({
      data: {
        rideId,
        driverId,
        userId,
        rating,
        comments: comment,
      },
    });

    // * Save average rating to driver table
    const avgRating = await getAverageRatingForDriver(driverId);
    await prisma.driver.update({
      where: { id: driverId },
      data: { rating: avgRating || isDriver.rating },
    });

    if (!newRating)
      throw new AppError(
        "Failed to create rating",
        StatusCodes.INTERNAL_SERVER_ERROR
      );

    return newRating;
  } catch (error: any) {
    logger.error("Error in createRatingService:", error);
    throw new AppError(
      `Failed to find drivers within radius: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAverageRatingForDriver = async (driverId: string) => {
  try {
    const result = await prisma.driverRating.aggregate({
      where: { driverId },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating;
  } catch (error: any) {
    logger.error("Error in getAverageRatingForDriver:", error);
    throw new AppError(
      `Failed to find drivers within radius: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
