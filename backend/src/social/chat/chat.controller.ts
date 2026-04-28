import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms') // GET /chat/rooms
  getMyRooms(@GetUser('userId') userId: string) {
    return this.chatService.getUserRooms(userId);
  }

  @Patch('rooms/:roomId/read') // PATCH /chat/rooms/:roomId/read
  markAsRead(
    @Param('roomId') roomId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.chatService.markMessagesAsRead(roomId, userId);
  }

  @Get('rooms/:roomId/unread-count') // GET /chat/rooms/:roomId/unread-count
  getUnreadCount(
    @Param('roomId') roomId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.chatService.getUnreadCount(roomId, userId);
  }

  @Get('unread-total') // GET /chat/unread-total
  getTotalUnreadCount(@GetUser('userId') userId: string) {
    return this.chatService.getTotalUnreadCount(userId);
  }
}
