import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    },
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Map: userId -> Socket[] (User might have multiple tabs)
    private userSockets: Map<string, Socket[]> = new Map();

    constructor(private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            // Validate Token
            // Try to get from Header or Cookie (same as ChatGateway)
            let token = client.handshake.headers.authorization?.split(' ')[1];

            if (!token && client.handshake.headers.cookie) {
                const cookies = client.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {} as any);
                token = cookies['access_token'];
            }

            // Fallback to query/auth for flexibility
            if (!token) {
                token = client.handshake.auth.token || client.handshake.query.token;
            }

            if (!token) {
                // console.log('Client connected without token:', client.id);
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            // Register Socket
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId)?.push(client);

            // Join Room for personal notifications
            client.join(`user_${userId}`);

            // console.log(`User ${userId} connected to Notifications: ${client.id}`);

        } catch (e) {
            // console.error('Notification Socket Connection Error:', e.message);
            // client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        // Remove socket from map
        for (const [userId, sockets] of this.userSockets.entries()) {
            const index = sockets.indexOf(client);
            if (index !== -1) {
                sockets.splice(index, 1);
                if (sockets.length === 0) {
                    this.userSockets.delete(userId);
                }
                break;
            }
        }
    }

    // Function for Service to call
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user_${userId}`).emit(event, data);
    }
}
