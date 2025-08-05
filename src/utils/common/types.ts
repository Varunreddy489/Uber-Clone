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

export type DriverLocation = {
  driverId: string;
  longitude: number;
  latitude: number;
};
