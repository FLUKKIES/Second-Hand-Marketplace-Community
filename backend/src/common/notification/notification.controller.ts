import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(@Req() req: any, @Query('page') page: number) {
    return this.notificationService.getUserNotifications(
      req.user.userId,
      page ? Number(page) : 1,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const result = await this.notificationService.getUserNotifications(
      req.user.userId,
      1,
    );
    return { count: result.meta.unreadCount };
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.markAsRead(id);
  }
}
