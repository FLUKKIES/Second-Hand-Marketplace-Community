import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // 1. หาห้องแชท หรือ สร้างใหม่ (Get or Create Room)
    async getRoom(userA: string, userB: string) {
        // Ensure consistent ordering to prevent duplicates
        const [firstUserId, secondUserId] = [userA, userB].sort();

        // Try to find existing room first
        let room = await this.prisma.chatRoom.findFirst({
            where: {
                OR: [
                    { initiatorId: userA, recipientId: userB },
                    { initiatorId: userB, recipientId: userA },
                ],
            },
            include: {
                messages: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: { select: { id: true, username: true, avatarUrl: true } }
                    }
                },
                initiator: { select: { id: true, username: true, avatarUrl: true } },
                recipient: { select: { id: true, username: true, avatarUrl: true } }
            }
        });

        // If no room exists, create one with transaction to prevent race condition
        if (!room) {
            try {
                room = await this.prisma.chatRoom.create({
                    data: {
                        initiatorId: firstUserId,
                        recipientId: secondUserId,
                    },
                    include: {
                        messages: {
                            include: {
                                sender: { select: { id: true, username: true, avatarUrl: true } }
                            }
                        },
                        initiator: { select: { id: true, username: true, avatarUrl: true } },
                        recipient: { select: { id: true, username: true, avatarUrl: true } }
                    }
                });
            } catch (error) {
                // If duplicate, try to fetch again (race condition happened)
                room = await this.prisma.chatRoom.findFirst({
                    where: {
                        OR: [
                            { initiatorId: userA, recipientId: userB },
                            { initiatorId: userB, recipientId: userA },
                        ],
                    },
                    include: {
                        messages: {
                            take: 50,
                            orderBy: { createdAt: 'desc' },
                            include: {
                                sender: { select: { id: true, username: true, avatarUrl: true } }
                            }
                        },
                        initiator: { select: { id: true, username: true, avatarUrl: true } },
                        recipient: { select: { id: true, username: true, avatarUrl: true } }
                    }
                });

                if (!room) {
                    throw error; // If still no room, throw original error
                }
            }
        }

        return room;
    }

    // 2. บันทึกข้อความ (Save Message)
    async saveMessage(roomId: string, senderId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT') {
        const message = await this.prisma.chatMessage.create({
            data: {
                roomId,
                senderId,
                content,
                type: type as any,
                isRead: false,
            },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } }
            }
        });

        // Update room updatedAt and get participants
        const room = await this.prisma.chatRoom.update({
            where: { id: roomId },
            data: { updatedAt: new Date() },
            include: {
                initiator: { select: { id: true } },
                recipient: { select: { id: true } }
            }
        });

        return { message, room };
    }

    // 3. ดึงรายการห้องแชทของฉัน (My Chat List)
    async getUserRooms(userId: string) {
        const rooms = await this.prisma.chatRoom.findMany({
            where: {
                OR: [{ initiatorId: userId }, { recipientId: userId }]
            },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: { select: { id: true, username: true } }
                    }
                },
                initiator: { select: { id: true, username: true, avatarUrl: true } },
                recipient: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Add unread count for each room
        const roomsWithUnread = await Promise.all(
            rooms.map(async (room) => {
                const unreadCount = await this.getUnreadCount(room.id, userId);
                return { ...room, unreadCount };
            })
        );

        return roomsWithUnread;
    }

    // 4. Mark messages as read
    async markMessagesAsRead(roomId: string, userId: string) {
        return this.prisma.chatMessage.updateMany({
            where: {
                roomId,
                senderId: { not: userId }, // Don't mark own messages
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }

    // 5. Get unread count for a room
    async getUnreadCount(roomId: string, userId: string) {
        return this.prisma.chatMessage.count({
            where: {
                roomId,
                senderId: { not: userId },
                isRead: false
            }
        });
    }

    // 6. Get total unread count across all rooms
    async getTotalUnreadCount(userId: string) {
        const rooms = await this.prisma.chatRoom.findMany({
            where: {
                OR: [{ initiatorId: userId }, { recipientId: userId }]
            },
            select: { id: true }
        });

        const counts = await Promise.all(
            rooms.map(room => this.getUnreadCount(room.id, userId))
        );

        return counts.reduce((sum, count) => sum + count, 0);
    }

    // 7. Get message history with pagination
    async getMessageHistory(roomId: string, take: number = 50, skip: number = 0) {
        return this.prisma.chatMessage.findMany({
            where: { roomId },
            take,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } }
            }
        });
    }
}
