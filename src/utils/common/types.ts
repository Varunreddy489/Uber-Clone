import { RideRequestStatus, VehicleType } from "../../generated/prisma";

export type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  isActive: boolean;
  curr_longitude?: number;
  curr_latitude?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type NearbyDriver = {
  id: string;
  currentLat: number;
  currentLng: number;
  vehicleType: string;
  vehicleNo: string;
  seatCapacity: number;
  isActive: boolean;
  distance: number;
};
export type DriverLocation = {
  driverId: string;
  longitude: number;
  latitude: number;
};

export type RideRequestTypes = {
  userId: string;
  driverId: string;
  destination: string;
  userLocation: string;
  fare: number;
  distance: number;
  vehicleType: VehicleType;
};

export type UpdateReqStatus = {
  rideId: string;
  rideRequestId: string;
  status: RideRequestStatus;
};

export type SendEmailParams = {
  toMail: string;
  subject: string;
  body: string;
};

declare global {
  namespace Express {
    export interface Request {
      user: {
        userId: string;
        role: string;
      };
    }
  }
}
