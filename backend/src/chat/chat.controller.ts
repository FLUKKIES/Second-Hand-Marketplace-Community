import { Controller, Get, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('rooms') // GET /chat/rooms
    getMyRooms(@GetUser('userId') userId: string) {
        return this.chatService.getUserRooms(userId);
    }
}