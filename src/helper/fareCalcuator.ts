import { VehicleFare } from "../utils/constants";

export const calculateEstimatedFare = (
  distance: number,
  vehicleType: string
): number => {
  const baseFare =
    VehicleFare[vehicleType as keyof typeof VehicleFare] || VehicleFare.ECONOMY;
  const estimatedFare = distance * baseFare;
  return Math.round(estimatedFare * 100) / 100;
};
