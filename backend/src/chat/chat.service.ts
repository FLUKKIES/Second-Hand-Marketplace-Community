import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // 1. หาห้องแชท หรือ สร้างใหม่ (Get or Create Room)
    async getRoom(userA: string, userB: string) {
        // ลองหาห้องที่มีทั้งคู่ (สลับฝั่งกันได้)
        let room = await this.prisma.chatRoom.findFirst({
            where: {
                OR: [
                    { initiatorId: userA, recipientId: userB },
                    { initiatorId: userB, recipientId: userA },
                ],
            },
            include: {
                messages: { take: 20, orderBy: { createdAt: 'desc' } }, // ดึงข้อความเก่าๆ ติดไปด้วย
                initiator: { select: { id: true, username: true, avatarUrl: true } },
                recipient: { select: { id: true, username: true, avatarUrl: true } }
            }
        });

        // ถ้าไม่มีห้อง ให้สร้างใหม่
        if (!room) {
            room = await this.prisma.chatRoom.create({
                data: {
                    initiatorId: userA,
                    recipientId: userB,
                },
                include: { messages: true, initiator: true, recipient: true } // format ให้ตรงกัน
            });
        }

        return room;
    }

    // 2. บันทึกข้อความ (Save Message)
    async saveMessage(roomId: string, senderId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT') {
        return this.prisma.chatMessage.create({
            data: {
                roomId,
                senderId,
                content,
                type: type as any, // Cast enum
            },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } } // ส่งข้อมูลคนส่งกลับไปด้วย
            }
        });
    }

    // 3. ดึงรายการห้องแชทของฉัน (My Chat List)
    async getUserRooms(userId: string) {
        return this.prisma.chatRoom.findMany({
            where: {
                OR: [{ initiatorId: userId }, { recipientId: userId }]
            },
            include: {
                // ดึงข้อความล่าสุด 1 อัน เพื่อโชว์หน้า List
                messages: { take: 1, orderBy: { createdAt: 'desc' } },
                initiator: { select: { id: true, username: true, avatarUrl: true } },
                recipient: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { updatedAt: 'desc' } // ห้องที่คุยล่าสุดอยู่บน
        });
    }
}