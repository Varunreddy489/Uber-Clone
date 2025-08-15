import { calculateDistance, isInRadius } from "../helper";

export const filterAndSortDrivers = async (
  userLat: number,
  userLng: number,
  drivers: Array<{
    id: string;
    currentLat: number | 0;
    currentLng: number | 0;
    [key: string]: any;
  }>,
  radius: number
) => {
  return drivers
    .filter((driver) => {
      if (!driver.currentLat || !driver.currentLng) return false;

      return isInRadius(
        userLat,
        userLng,
        driver.currentLat,
        driver.currentLng,
        radius
      );
    })
    .map((driver) => ({
      ...driver,
      distance: calculateDistance(
        userLat,
        userLng,
        driver.currentLat,
        driver.currentLng
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};
