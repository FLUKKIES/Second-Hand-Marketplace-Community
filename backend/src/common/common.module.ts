import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // *เช็ค path ดีๆ หลังย้าย
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { GeminiModule } from './ai/gemini/gemini.module';
import { SearchModule } from './search/search.module';
import { NotificationModule } from './notification/notification.module';

@Global() // ใส่ Global เพื่อให้ module อื่นเรียกใช้ service พวกนี้ได้เลยไม่ต้อง import ซ้ำ (Optional แต่แนะนำสำหรับ core)
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UploadModule,
    GeminiModule,
    SearchModule,
    NotificationModule,
  ],
  exports: [AuthModule, PrismaModule, UploadModule, GeminiModule, SearchModule], // export ตัวที่ module อื่นต้องใช้
})
export class CommonModule {}
