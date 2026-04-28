import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { JwtModule } from '@nestjs/jwt'; // For validating socket token
import { PrismaModule } from 'src/common/database/prisma/prisma.module';

import { NotificationController } from './notification.controller';

@Global() // Make it global so we can just inject NotificationService/EventEmitter anywhere
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // Just for using JwtService to verify token
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
