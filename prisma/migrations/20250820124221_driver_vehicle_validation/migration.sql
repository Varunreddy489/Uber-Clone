/*
  Warnings:

  - You are about to drop the `ride` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ride" DROP CONSTRAINT "ride_driverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ride" DROP CONSTRAINT "ride_rideRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ride" DROP CONSTRAINT "ride_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicle" DROP CONSTRAINT "vehicle_driverId_fkey";

-- AlterTable
ALTER TABLE "public"."Driver" ADD COLUMN     "LicenseImage" TEXT,
ADD COLUMN     "LicenseNumber" TEXT,
ADD COLUMN     "Proof" TEXT;

-- DropTable
DROP TABLE "public"."ride";

-- DropTable
DROP TABLE "public"."vehicle";

-- CreateTable
CREATE TABLE "public"."Vehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "company" TEXT NOT NULL,
    "vehicleImage" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "seatCapacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "curr_location" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "rideType" "public"."VehicleType" NOT NULL,
    "status" "public"."RideStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "pickupTime" TIMESTAMP(3),
    "dropTime" TIMESTAMP(3),
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION,
    "fare" DOUBLE PRECISION NOT NULL,
    "rideRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_driverId_key" ON "public"."Vehicle"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vehicleNo_key" ON "public"."Vehicle"("vehicleNo");

-- CreateIndex
CREATE INDEX "Vehicle_isActive_idx" ON "public"."Vehicle"("isActive");

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "public"."Vehicle"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_vehicleType_idx" ON "public"."Vehicle"("vehicleType");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_vehicleId_key" ON "public"."Ride"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_rideRequestId_key" ON "public"."Ride"("rideRequestId");

-- CreateIndex
CREATE INDEX "Ride_status_idx" ON "public"."Ride"("status");

-- CreateIndex
CREATE INDEX "Ride_driverId_status_idx" ON "public"."Ride"("driverId", "status");

-- CreateIndex
CREATE INDEX "Ride_userId_status_idx" ON "public"."Ride"("userId", "status");

-- AddForeignKey
ALTER TABLE "public"."Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ride" ADD CONSTRAINT "Ride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ride" ADD CONSTRAINT "Ride_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ride" ADD CONSTRAINT "Ride_rideRequestId_fkey" FOREIGN KEY ("rideRequestId") REFERENCES "public"."RideRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
