-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('RIDE_REQUEST', 'RIDE_ACCEPTED', 'RIDE_COMPLETED', 'PAYMENT_RECEIVED', 'DRIVER_VERIFICATION', 'SYSTEM_ALERT', 'PROMOTIONAL');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'BANK_TRANSFER', 'CASH');

-- CreateTable
CREATE TABLE "public"."Notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "transactionType" "public"."TransactionType" NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "parentPaymentId" TEXT,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 100.0,
    "method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "gatewayTxnId" TEXT,
    "gatewayResponse" JSONB,
    "failureReason" TEXT,
    "refundAmount" DECIMAL(10,2),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notifications_userId_isRead_idx" ON "public"."Notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notifications_createdAt_idx" ON "public"."Notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "public"."Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "public"."Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_referenceId_key" ON "public"."WalletTransaction"("referenceId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "public"."WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceId_idx" ON "public"."WalletTransaction"("referenceId");

-- CreateIndex
CREATE INDEX "WalletTransaction_transactionType_createdAt_idx" ON "public"."WalletTransaction"("transactionType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayTxnId_key" ON "public"."Payment"("gatewayTxnId");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "public"."Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_rideId_idx" ON "public"."Payment"("rideId");

-- CreateIndex
CREATE INDEX "Payment_gatewayTxnId_idx" ON "public"."Payment"("gatewayTxnId");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "public"."Payment"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_parentPaymentId_fkey" FOREIGN KEY ("parentPaymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "public"."Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
