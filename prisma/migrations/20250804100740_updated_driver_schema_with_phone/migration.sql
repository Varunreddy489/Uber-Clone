/*
  Warnings:

  - A unique constraint covering the columns `[phone_number]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone_number` to the `Driver` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "phone_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_number_key" ON "Driver"("phone_number");
