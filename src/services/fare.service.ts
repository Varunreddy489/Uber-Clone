import {
  getWeather,
  getActiveUsersInLocation,
  getDriversAvailableInUserProximity,
} from "../services";
import { VehicleFare } from "../utils/constants";
import { WeatherConditions } from "../utils/common";

/**
 * Calculates an estimated fare for a given ride.
 *
 * The estimated fare is based on the distance, vehicle type, and
 * location of the ride. The fare is calculated as the sum of the
 * base fare, distance fare, time surge, weather surge, and demand surge.
 *
 * @param distance The distance of the ride.
 * @param vehicleType The type of vehicle for the ride.
 * @param longitude The longitude of the ride's starting location.
 * @param latitude The latitude of the ride's starting location.
 *
 * @returns {Promise<Object>} An object containing the estimated fare.
 */

export const calculateEstimatedFare = async (
  distance: number,
  vehicleType: string,
  longitude: number,
  latitude: number
) => {
  try {
    const baseFareRate =
      VehicleFare[vehicleType as keyof typeof VehicleFare] ||
      VehicleFare.ECONOMY;

    const distanceFare = distance * baseFareRate;

    const timeSurge = await calculateTimeSurge(latitude, longitude);
    const weatherSurge = await calculateWeatherSurge(latitude, longitude);
    const demandSurge = await calculateDemandSurge(latitude, longitude, 50);

    const totalFare = distanceFare + timeSurge + weatherSurge + demandSurge;

    return {
      baseFare: baseFareRate,
      distanceFare,
      surgeCharges: {
        time: timeSurge,
        weather: weatherSurge,
        demand: demandSurge,
      },
      totalFare,
    };
  } catch (error: any) {
    const baseFare = 2.5;
    const distanceFare = distance * baseFare; // still compute something
    const totalFare = distanceFare + baseFare;

    return {
      baseFare,
      distanceFare,
      surgeCharges: { time: 0, weather: 0, demand: 0 },
      totalFare,
    };
  }
};

const calculateTimeSurge = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  try {
    const time = new Date(Date.now());
    const hours = time.getHours();
    const day = new Date().getDay();

    // Surge for evening and early morning hours ( 10->6 )
    if (hours <= 6 || hours >= 22) {
      return 5.0;
    }

    // Rush hours on weekdays
    if (day >= 1 && day <= 5) {
      if ((hours >= 7 && hours <= 9) || (hours >= 16 && hours <= 19))
        return 3.0;
    }

    // weekend peak (Friday/Saturday night)
    if ((day === 5 || day === 6) && (hours >= 19 || hours <= 2)) {
      return 4.0;
    }

    return 0;
  } catch (error: any) {
    console.warn("Time surge calculation failed, using local time");
    const hours = new Date().getHours();
    return hours < 6 || hours > 22 ? 3.0 : 0;
  }
};

const calculateWeatherSurge = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  try {
    const weather: WeatherConditions = await getWeather(latitude, longitude);
    let surge = 0;

    if (weather?.rain) {
      surge += (weather.rainIntensity || 0) > 5 ? 4.0 : 2.0;
    }

    if (weather?.snow) {
      surge += 5.0;
    }

    if (weather?.storm) {
      surge += 7.0;
    }

    // Extreme temperatures
    if (
      weather?.temperature &&
      (weather.temperature < -10 || weather.temperature > 40)
    ) {
      surge += 2.0;
    }

    return surge;
  } catch (error: any) {
    console.warn("Weather surge calculation failed");
    return 0;
  }
};

const calculateDemandSurge = async (
  latitude: number,
  longitude: number,
  DriverRadius: number
): Promise<number> => {
  try {
    const driverResult = await getDriversAvailableInUserProximity(
      latitude,
      longitude,
      DriverRadius
    );

    if (!driverResult) throw new Error("No drivers found");

    const userCount = await getActiveUsersInLocation(
      latitude,
      longitude,
      DriverRadius
    );

    const driverCount = driverResult.count;

    const demandRatio = driverCount > 0 ? userCount / driverCount : userCount;

    if (demandRatio > 3) {
      return 8.0;
    } else if (demandRatio > 2) {
      return 5.0;
    }
    return 2.0;
  } catch (error: any) {
    console.warn("Demand surge calculation failed");
    return 0;
  }
};
