import { StatusCodes } from "http-status-codes";
import AppError from "../utils/errors/app.error";
import { logger, cloudinaryConfig } from "../config";

export const cloudinaryService = async (file: any) => {
  try {
    const result = await cloudinaryConfig.uploader.upload(file, {
      resource_type: "auto",
    });

    return result.secure_url;
  } catch (error: any) {
    logger.error("Error in cloudinaryService:", error);
    throw new AppError(error.message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
