export const VEHICLE_TYPES = ["ECONOMY", "PREMIUM", "LUXURY"] as const;

export const VehicleFare = {
  ECONOMY: 10,
  PREMIUM: 20,
  LUXURY: 30,
} as const;

export const DriverRadius = 5;

export const RideRequestAcceptTime = 2 * 60 * 1000; // 2 minutes in milliseconds