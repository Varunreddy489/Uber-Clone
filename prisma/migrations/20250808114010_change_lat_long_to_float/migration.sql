/*
  Warnings:

  - The `curr_lat` column on the `Driver` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `curr_long` column on the `Driver` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `curr_lat` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `curr_long` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "curr_lat",
ADD COLUMN     "curr_lat" DOUBLE PRECISION,
DROP COLUMN "curr_long",
ADD COLUMN     "curr_long" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "curr_lat",
ADD COLUMN     "curr_lat" DOUBLE PRECISION,
DROP COLUMN "curr_long",
ADD COLUMN     "curr_long" DOUBLE PRECISION;
