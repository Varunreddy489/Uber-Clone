import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { logger } from "../config";
import dotenv from "dotenv";
import AppError from "../utils/errors/app.error";

dotenv.config();

export const locationService = async (address: string) => {
  const API_KEY = process.env.GOOGLE_MAPS_KEY;

  if (!API_KEY) {
    throw new AppError(
      "Google Maps API key is not configured",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${API_KEY}`;

  try {
    logger.info(`Geocoding address: ${address}`);

    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== "OK") {
      throw new AppError(
        `Geocoding failed: ${data.status} - ${
          data.error_message || "Unknown error"
        }`,
        StatusCodes.BAD_REQUEST
      );
    }

    if (!data.results || data.results.length === 0) {
      throw new AppError(
        `No location found for address: ${address}`,
        StatusCodes.NOT_FOUND
      );
    }

    const result = data.results[0];
    if (!result.geometry || !result.geometry.location) {
      throw new AppError(
        `Invalid location data received for address: ${address}`,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const location = result.geometry.location;

    logger.info(`Location found: ${location.lat}, ${location.lng}`);

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    // Handle axios errors
    if (error.response) {
      throw new AppError(
        `Google Maps API error: ${error.response.status} - ${
          error.response.data?.error_message || error.message
        }`,
        StatusCodes.BAD_GATEWAY
      );
    }

    throw new AppError(
      "Error in locationService: " + error.message,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getTimeService = async (origin: string, destination: string) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${process.env.GOOGLE_MAPS_KEY}`;

    const response = await axios.get(url);
    const data = response.data;

    return data.rows[0].elements[0].duration.text;
  } catch (error: any) {
    throw new AppError(
      "Error in getTimeService: " + error.message,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
