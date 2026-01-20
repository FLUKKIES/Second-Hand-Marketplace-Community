/*
  Warnings:

  - A unique constraint covering the columns `[initiatorId,recipientId]` on the table `chat_rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "chat_rooms_initiatorId_idx" ON "chat_rooms"("initiatorId");

-- CreateIndex
CREATE INDEX "chat_rooms_recipientId_idx" ON "chat_rooms"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_initiatorId_recipientId_key" ON "chat_rooms"("initiatorId", "recipientId");
