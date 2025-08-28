import { toRadians } from "../utils/common/converter";

/**
 * Calculates the distance between two lat/lng points using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers (rounded to 2 decimal places)
 */

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const earthRadius = 6371;

  const lat_dis = toRadians(lat2 - lat1);
  const lon_dis = toRadians(lon2 - lon1);

  const a =
    Math.sin(lat_dis / 2) * Math.sin(lat_dis / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(lon_dis / 2) *
      Math.sin(lon_dis / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadius * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Checks if a driver is within a certain radius of a user.
 * @param userLat Latitude of the user
 * @param userLng Longitude of the user
 * @param driverLat Latitude of the driver
 * @param driverLng Longitude of the driver
 * @returns True if the driver is within the radius, false otherwise
 */
export const isInRadius = (
  userLat: number,
  userLng: number,
  driverLat: number,
  driverLng: number,
  radius: number
) => {
  const distance = calculateDistance(userLat, userLng, driverLat, driverLng);
  return distance <= radius;
};
