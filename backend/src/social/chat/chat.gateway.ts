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
    cors: {
        origin: true, // Allow all origins for dev simplicity or strict match in prod
        credentials: true
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Track online users
    private onlineUsers = new Map<string, string[]>(); // userId -> socketId[]

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    // 1. ทำงานเมื่อมี User เชื่อมต่อ (เหมือน Login)
    async handleConnection(client: Socket) {
        try {
            // ดึง Token จาก Header หรือ Cookie
            let token = client.handshake.headers.authorization?.split(' ')[1];

            if (!token && client.handshake.headers.cookie) {
                // Try to parse from cookie
                const cookies = client.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {} as any);
                token = cookies['access_token'];
            }

            if (!token) throw new Error('No token');

            // Verify Token
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            // เก็บ userId ไว้ใน Socket object เพื่อใช้ทีหลัง
            const userId = payload.sub;
            client.data.userId = userId;
            console.log(`Client connected: ${userId}`);

            // Track online status
            if (!this.onlineUsers.has(userId)) {
                this.onlineUsers.set(userId, []);
            }
            this.onlineUsers.get(userId)?.push(client.id);

            // Join ห้องส่วนตัวไว้รอรับ Notification
            client.join(`user_${userId}`);

            // Broadcast online status to all users
            this.server.emit('userOnline', { userId });

        } catch (e) {
            console.error('Connection rejected:', e.message);
            console.error('Headers:', client.handshake.headers);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        console.log(`Client disconnected: ${client.id}`);

        if (userId && this.onlineUsers.has(userId)) {
            const sockets = this.onlineUsers.get(userId);
            if (!sockets) return;

            const filteredSockets = sockets.filter(id => id !== client.id);

            if (filteredSockets.length === 0) {
                // User is completely offline
                this.onlineUsers.delete(userId);
                this.server.emit('userOffline', { userId });
            } else {
                this.onlineUsers.set(userId, filteredSockets);
            }
        }
    }

    // 2. Event: เข้าห้องแชท (Join Room)
    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any, // Can be targetUserId or object with callback
    ): Promise<any> {
        try {
            const targetUserId = typeof data === 'string' ? data : data.targetUserId;
            const myUserId = client.data.userId;

            if (!targetUserId) {
                return { event: 'error', data: { message: 'Missing targetUserId' } };
            }

            // เรียก Service เพื่อหา ID ห้อง (หรือสร้างใหม่)
            const room = await this.chatService.getRoom(myUserId, targetUserId);

            // Join Socket Room
            client.join(room.id);

            // Emit history as a separate event (better for large payloads)
            client.emit('history', room);

            const response = { event: 'joined', data: { roomId: room.id } };

            // Return for acknowledgment callback
            return response;
        } catch (error) {
            console.error('[joinRoom] Error:', error.message);
            return { event: 'error', data: { message: 'Failed to join room', error: error.message } };
        }
    }

    // 3. Event: ส่งข้อความ (Send Message)
    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; content: string },
    ) {
        const senderId = client.data.userId;

        // A. บันทึกลง DB
        const { message, room } = await this.chatService.saveMessage(
            payload.roomId,
            senderId,
            payload.content,
        );

        // B. ส่งข้อความหา "ทุกคนในห้องนั้น" (รวมถึงตัวเองด้วย)
        this.server.to(payload.roomId).emit('newMessage', message);

        // C. แจ้งเตือนเพื่อให้ Chat List อัปเดต (ส่งให้ทั้งสองฝั่ง)
        [room.initiator.id, room.recipient.id].forEach(uid => {
            this.server.to(`user_${uid}`).emit('chatListUpdate', message);
        });
    }

    // 4. Event: User is typing
    @SubscribeMessage('userTyping')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string },
    ) {
        const userId = client.data.userId;
        // Broadcast to everyone in the room except sender
        client.to(payload.roomId).emit('userTyping', { userId, roomId: payload.roomId });
    }

    // 5. Event: User stopped typing
    @SubscribeMessage('userStoppedTyping')
    handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string },
    ) {
        const userId = client.data.userId;
        client.to(payload.roomId).emit('userStoppedTyping', { userId, roomId: payload.roomId });
    }

    // 6. Event: Mark messages as read
    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string },
    ) {
        const userId = client.data.userId;

        await this.chatService.markMessagesAsRead(payload.roomId, userId);

        // Notify other users in the room that messages were read
        client.to(payload.roomId).emit('messagesRead', {
            userId,
            roomId: payload.roomId,
            readAt: new Date()
        });
    }

    // 7. Check if user is online
    @SubscribeMessage('checkOnlineStatus')
    handleCheckOnline(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { userId: string },
    ) {
        const isOnline = this.onlineUsers.has(payload.userId);
        return { userId: payload.userId, isOnline };
    }

    // 8. Get all online users
    @SubscribeMessage('getOnlineUsers')
    handleGetOnlineUsers() {
        return Array.from(this.onlineUsers.keys());
    }
}
