-- CreateTable
CREATE TABLE "ride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "start_latitude" DOUBLE PRECISION NOT NULL,
    "start_longitude" DOUBLE PRECISION NOT NULL,
    "end_latitude" DOUBLE PRECISION NOT NULL,
    "end_longitude" DOUBLE PRECISION NOT NULL,
    "rideType" "VehicleType" NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "pickupTime" TIMESTAMP(3) NOT NULL,
    "dropTime" TIMESTAMP(3),
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
