import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: '*', // Adjust in production
    },
    namespace: 'notifications'
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
            // Expected format: Authorization: Bearer <token>
            // In Socket.IO common pattern is query param or handshake auth
            const token = client.handshake.auth.token || client.handshake.query.token;

            if (!token) {
                // client.disconnect();
                // return;
                // For dev/test ease, we sometimes skip auth or handle it gracefully
                console.log('Client connected without token:', client.id);
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub; // Assuming 'sub' is userId

            // Register Socket
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId)?.push(client);

            // Join Room (Optional, but useful for broadcast to user)
            client.join(`user_${userId}`);

            console.log(`User ${userId} connected: ${client.id}`);

        } catch (e) {
            console.error('Socket Connection Error:', e.message);
            client.disconnect();
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
