/*
  Warnings:

  - You are about to drop the column `curr_location` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `destination` on the `Ride` table. All the data in the column will be lost.
  - You are about to drop the column `distance` on the `Ride` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Ride" DROP COLUMN "curr_location",
DROP COLUMN "destination",
DROP COLUMN "distance";
