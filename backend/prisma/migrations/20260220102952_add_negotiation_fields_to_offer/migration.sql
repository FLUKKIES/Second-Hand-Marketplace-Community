/*
  Warnings:

  - You are about to drop the column `counterNote` on the `offers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CounteredBy" AS ENUM ('BUYER', 'SELLER');

-- AlterTable
ALTER TABLE "offers" DROP COLUMN "counterNote",
ADD COLUMN     "lastCounteredBy" "CounteredBy",
ADD COLUMN     "negotiationNote" TEXT;
