import fs from "fs/promises";
import { StatusCodes } from "http-status-codes";

import { logger, prisma } from "../config";
import { sendEmail } from "./mail.service";
import AppError from "../utils/errors/app.error";
import { createRideService } from "./ride.service";
import { locationService } from "./location.service";
import { cloudinaryService } from "./cloudinary.service";
import {
  notificationMessages,
  RideRequestAcceptTime,
} from "../utils/constants";
import { createNotification } from "./notification.service";
import {
  NotificationType,
  RideRequestStatus,
  VehicleType,
} from "../generated/prisma";

export const updateDriversLocation = async (
  driverId: string,
  location: string
) => {
  try {
    const driverLocation = await locationService(location);

    // Todo : Refactor the code when the  location is changed rather  than creating a new set update the existing one
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        location: driverLocation.formatted_address,
        curr_lat: driverLocation.lat,
        curr_long: driverLocation.lng,
      },
    });

    if (!updatedDriver) {
      throw new AppError(
        `Failed to update driver location: Driver not found`,
        StatusCodes.NOT_FOUND
      );
    }

    // await redisClient.geoadd(
    //   "driver:locations",
    //   driverLocation.lng,
    //   driverLocation.lat,
    //   driverId
    // );

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

export const createDriverService = async (
  userId: string,
  licenseNumber: string,
  files: { [fieldname: string]: Express.Multer.File[] }
) => {
  if (!userId) {
    throw new AppError("User ID is required", StatusCodes.BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", StatusCodes.BAD_REQUEST);
  }

  if (!licenseNumber) {
    throw new AppError("License Number is required", StatusCodes.BAD_REQUEST);
  }

  if (!files) {
    throw new AppError(
      "License and Govt Proof are required",
      StatusCodes.BAD_REQUEST
    );
  }

  const licenseImage = files["LicenseImage"]?.[0];
  const govtProof = files["govt_proof"]?.[0];

  if (!licenseImage || !govtProof) {
    throw new AppError(
      "License and Govt Proof are required",
      StatusCodes.BAD_REQUEST
    );
  }

  // Upload to Cloudinary
  const license_url = await cloudinaryService(licenseImage.path);
  const govt_url = await cloudinaryService(govtProof.path);

  // Remove local files
  await fs.unlink(licenseImage.path);
  await fs.unlink(govtProof.path);

  const driver = await prisma.driver.create({
    data: {
      userId,
      phone_number: user.phone_number,
      LicenseNumber: licenseNumber,
      LicenseImage: license_url,
      Proof: govt_url,
    },
  });

  // Send Email
  await sendEmail({
    toMail: user.email,
    subject: "We Received Your Application",
    body: `
      <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
        <p style="color: #666;">Hello ${user.name},</p>
        <p style="color: #333;">
          We received your driver application. We will verify and approve it soon.
        </p>
      </div>
    `,
  });

  logger.info(`Driver created for user ${user.email}`);

  return driver;
};

export const vehicleRegisterService = async (
  driverId: string,
  vehicleData: {
    vehicleNo: string;
    vehicleType: string;
    company: string;
    model: string;
    seatCapacity: number;
  },
  files: { [fieldname: string]: Express.Multer.File[] }
) => {
  try {
    const { vehicleNo, vehicleType, company, model, seatCapacity } =
      vehicleData;

    if (!driverId) {
      throw new AppError("Driver ID is required", StatusCodes.BAD_REQUEST);
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });
    if (!driver) {
      throw new AppError("Driver not found", StatusCodes.BAD_REQUEST);
    }

    if (!files) {
      throw new AppError("Vehicle image is required", StatusCodes.BAD_REQUEST);
    }

    const vehicleImage = files["vehicleImage"]?.[0];
    if (!vehicleImage) {
      throw new AppError("Vehicle image is required", StatusCodes.BAD_REQUEST);
    }

    // Upload vehicle image
    const vehicleImage_url = await cloudinaryService(vehicleImage.path);

    // Remove local file
    await fs.unlink(vehicleImage.path);

    const vehicle = await prisma.vehicle.create({
      data: {
        driverId,
        vehicleNo,
        vehicleType: vehicleType.toUpperCase() as VehicleType,
        company,
        model,
        seatCapacity,
        vehicleImage: vehicleImage_url,
      },
    });

    await sendEmail({
      toMail: driver.user.email,
      subject: "We Received Your Application",
      body: `
      <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
        <p style="color: #666;">Hello ${driver.user.name},</p>
        <p style="color: #333;">
         We Registered your vehicle.
        </p>
      </div>
    `,
    });

    logger.info(`Vehicle registered for driver ${driverId}`);

    return vehicle;
  } catch (error: any) {
    throw new AppError(
      `error in vehicleRegisterService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const requestUpdateService = async (
  rideRequestId: string,
  status: RideRequestStatus
) => {
  try {
    const idRequest = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
    });

    if (!idRequest) {
      throw new AppError("Ride Request not found", StatusCodes.BAD_REQUEST);
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { driverId: idRequest.driverId },
      include: { driver: true },
    });

    let response;
    let notificationData;

    const createRideData = {
      driverId: idRequest.driverId,
      userId: idRequest.userId,
      vehicleId: vehicle?.id,
      userLocation: idRequest.userLocation,
      destination: idRequest.destination,
    };

    switch (status) {
      case RideRequestStatus.ACCEPTED:
        response = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: { status: RideRequestStatus.ACCEPTED },
        });

        if (response.status === RideRequestStatus.ACCEPTED) {
          await createRideService(createRideData);
        }

        notificationData = {
          userId: idRequest.userId,
          title: "Ride Accepted and created ",
          message: "Your Ride is Accepted and Ride is created",
          category: NotificationType.RIDE_ACCEPTED,
        };

        await createNotification(notificationData);

        break;

      case RideRequestStatus.REJECTED:
        response = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: { status: RideRequestStatus.REJECTED },
        });

        notificationData = {
          userId: idRequest.userId,
          title: notificationMessages.RIDE_REJECTED().title,
          message: notificationMessages.RIDE_REJECTED().message,
          category: NotificationType.RIDE_ACCEPTED,
        };

        await createNotification(notificationData);

        break;
      default:
        response = idRequest;
        setTimeout(async () => {
          response = await prisma.rideRequest.update({
            where: { id: rideRequestId },
            data: { status: RideRequestStatus.TIMED_OUT },
          });
        }, RideRequestAcceptTime);

        notificationData = {
          userId: idRequest.userId,
          title: notificationMessages.RIDE_TIMEOUT().title,
          message: notificationMessages.RIDE_TIMEOUT().message,
          category: NotificationType.RIDE_ACCEPTED,
        };

        await createNotification(notificationData);

        break;
    }
    return response;
  } catch (error: any) {
    throw new AppError(
      `error in requestUpdateService: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
