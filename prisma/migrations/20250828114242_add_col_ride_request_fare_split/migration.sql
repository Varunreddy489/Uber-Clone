/*
  Warnings:

  - You are about to drop the column `fare` on the `RideRequest` table. All the data in the column will be lost.
  - Added the required column `baseFare` to the `RideRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFare` to the `RideRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."RideRequest" DROP COLUMN "fare",
ADD COLUMN     "baseFare" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "distanceFare" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "surgeFare" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "timeFare" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalFare" DOUBLE PRECISION NOT NULL;
