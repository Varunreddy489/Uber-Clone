import sharp from "sharp";

import { logger } from "../config";
import { StatusCodes } from "http-status-codes";
import AppError from "../utils/errors/app.error";
import { UPLOAD_TYPES } from "../utils/constants";

export const processImage = async (
  inputPath: string,
  uploadType: keyof typeof UPLOAD_TYPES
): Promise<Buffer> => {
  try {
    const config = UPLOAD_TYPES[uploadType];

    let pipeline = sharp(inputPath)
      .rotate() // Auto-rotate based on EXIF
      .resize(config.dimensions.width, config.dimensions.height, {
        fit: "inside",
        withoutEnlargement: true,
      });

    // Apply format-specific optimizations
    if (config.allowedTypes.includes("image/webp")) {
      pipeline = pipeline.webp({ quality: config.quality });
    } else {
      pipeline = pipeline.jpeg({ quality: config.quality, progressive: true });
    }

    return await pipeline.toBuffer();
  } catch (error) {
    logger.error("Error processing image:", error);
    throw new AppError("Failed to process image", StatusCodes.BAD_REQUEST);
  }
};
