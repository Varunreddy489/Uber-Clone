/*
  Warnings:

  - Added the required column `baseFare` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationAddress` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationLat` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationLong` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedDistance` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedDuration` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLatitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLocation` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLongitude` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFare` to the `Ride` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Ride" ADD COLUMN     "actualDistance" DOUBLE PRECISION,
ADD COLUMN     "actualDuration" INTEGER,
ADD COLUMN     "baseFare" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "destinationAddress" TEXT NOT NULL,
ADD COLUMN     "destinationLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "destinationLong" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "distanceFare" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "estimatedDistance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "estimatedDuration" INTEGER NOT NULL,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "pickupLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pickupLocation" TEXT NOT NULL,
ADD COLUMN     "pickupLongitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "surgeFare" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "timeFare" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalFare" DOUBLE PRECISION NOT NULL;
