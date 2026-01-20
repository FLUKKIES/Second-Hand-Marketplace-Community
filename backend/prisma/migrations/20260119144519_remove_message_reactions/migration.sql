/*
  Warnings:

  - You are about to drop the `message_reactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_messageId_fkey";

-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_userId_fkey";

-- DropTable
DROP TABLE "message_reactions";
