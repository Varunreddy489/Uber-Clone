import { StatusCodes } from "http-status-codes";
import { logger, prisma } from "../config";
import AppError from "../utils/errors/app.error";

export const createNotification = async (data: any) => {
  try {
    const { userId, title, message, category } = data;

    const notification = await prisma.notifications.create({
      data: {
        userId,
        title,
        message,
        category,
      },
    });
    return notification;
  } catch (error: any) {
    logger.error("Error in createNotification:", error);

    throw new AppError(
      `Error in createNotification: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
