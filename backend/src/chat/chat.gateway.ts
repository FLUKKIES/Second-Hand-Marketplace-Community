import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: { origin: '*' }, // อนุญาตให้ Frontend เชื่อมต่อได้
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    // 1. ทำงานเมื่อมี User เชื่อมต่อ (เหมือน Login)
    async handleConnection(client: Socket) {
        try {
            // ดึง Token จาก Header หรือ Query Param
            const token = client.handshake.headers.authorization?.split(' ')[1];
            if (!token) throw new Error('No token');

            // Verify Token
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            // เก็บ userId ไว้ใน Socket object เพื่อใช้ทีหลัง
            client.data.userId = payload.sub;
            console.log(`Client connected: ${payload.sub}`);

            // (Optional) Join ห้องส่วนตัวไว้รอรับ Notification
            client.join(`user_${payload.sub}`);

        } catch (e) {
            console.log('Connection rejected');
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    // 2. Event: เข้าห้องแชท (Join Room)
    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() targetUserId: string, // User ID ของคู่สนทนา
    ) {
        const myUserId = client.data.userId;

        // เรียก Service เพื่อหา ID ห้อง (หรือสร้างใหม่)
        const room = await this.chatService.getRoom(myUserId, targetUserId);

        // Join Socket Room
        client.join(room.id);

        // ส่งประวัติแชทเก่าๆ กลับไปให้ User
        return { event: 'history', data: room };
    }

    // 3. Event: ส่งข้อความ (Send Message)
    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; content: string },
    ) {
        const senderId = client.data.userId;

        // A. บันทึกลง DB
        const savedMessage = await this.chatService.saveMessage(
            payload.roomId,
            senderId,
            payload.content,
        );

        // B. ส่งข้อความหา "ทุกคนในห้องนั้น" (รวมถึงตัวเองด้วย)
        // event ชื่อ 'newMessage'
        this.server.to(payload.roomId).emit('newMessage', savedMessage);
    }
}