-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OfferStatus" ADD VALUE 'COUNTER_OFFERED';
ALTER TYPE "OfferStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "counterCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "counterNote" TEXT,
ADD COLUMN     "counterPrice" DECIMAL(10,2),
ADD COLUMN     "expiresAt" TIMESTAMP(3);
