/*
  Warnings:

  - You are about to alter the column `total_time` on the `Driver` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `isRevoked` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otp` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "acceptance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ALTER COLUMN "total_time" SET DEFAULT 0,
ALTER COLUMN "total_time" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "isRevoked";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isActive",
DROP COLUMN "isVerified",
DROP COLUMN "otp",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastFailedLoginAt" TIMESTAMP(3),
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerificationOtp" INTEGER,
ADD COLUMN     "profileImage" TEXT;

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempts_userId_success_createdAt_idx" ON "login_attempts"("userId", "success", "createdAt");

-- CreateIndex
CREATE INDEX "login_attempts_ipAddress_createdAt_idx" ON "login_attempts"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "login_attempts_email_success_createdAt_idx" ON "login_attempts"("email", "success", "createdAt");

-- CreateIndex
CREATE INDEX "login_attempts_phoneNumber_success_createdAt_idx" ON "login_attempts"("phoneNumber", "success", "createdAt");

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
