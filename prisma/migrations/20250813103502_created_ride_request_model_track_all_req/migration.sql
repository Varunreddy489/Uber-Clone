/*
  Warnings:

  - A unique constraint covering the columns `[rideRequestId]` on the table `ride` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RideRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'TIMED_OUT', 'CANCELLED');

-- AlterTable
ALTER TABLE "ride" ADD COLUMN     "rideRequestId" TEXT;

-- CreateTable
CREATE TABLE "RideRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "userLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "status" "RideRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RideRequest_userId_status_idx" ON "RideRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "RideRequest_driverId_status_idx" ON "RideRequest"("driverId", "status");

-- CreateIndex
CREATE INDEX "RideRequest_createdAt_idx" ON "RideRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Driver_driverStatus_idx" ON "Driver"("driverStatus");

-- CreateIndex
CREATE INDEX "Driver_curr_lat_curr_long_idx" ON "Driver"("curr_lat", "curr_long");

-- CreateIndex
CREATE INDEX "User_id_phone_number_idx" ON "User"("id", "phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "ride_rideRequestId_key" ON "ride"("rideRequestId");

-- CreateIndex
CREATE INDEX "ride_status_idx" ON "ride"("status");

-- CreateIndex
CREATE INDEX "ride_driverId_status_idx" ON "ride"("driverId", "status");

-- CreateIndex
CREATE INDEX "ride_userId_status_idx" ON "ride"("userId", "status");

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_rideRequestId_fkey" FOREIGN KEY ("rideRequestId") REFERENCES "RideRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
