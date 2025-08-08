/*
  Warnings:

  - You are about to drop the column `curr_latitude` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `curr_longitude` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `curr_latitude` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `curr_longitude` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `end_latitude` on the `ride` table. All the data in the column will be lost.
  - You are about to drop the column `end_longitude` on the `ride` table. All the data in the column will be lost.
  - You are about to drop the column `start_latitude` on the `ride` table. All the data in the column will be lost.
  - You are about to drop the column `start_longitude` on the `ride` table. All the data in the column will be lost.
  - Added the required column `curr_location` to the `ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination` to the `ride` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "curr_latitude",
DROP COLUMN "curr_longitude",
ADD COLUMN     "curr_lat" TEXT,
ADD COLUMN     "curr_long" TEXT,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "curr_latitude",
DROP COLUMN "curr_longitude",
ADD COLUMN     "curr_lat" TEXT,
ADD COLUMN     "curr_long" TEXT,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "ride" DROP COLUMN "end_latitude",
DROP COLUMN "end_longitude",
DROP COLUMN "start_latitude",
DROP COLUMN "start_longitude",
ADD COLUMN     "curr_location" TEXT NOT NULL,
ADD COLUMN     "destination" TEXT NOT NULL;
