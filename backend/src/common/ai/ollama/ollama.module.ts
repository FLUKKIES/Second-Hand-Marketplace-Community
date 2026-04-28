import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OllamaService } from './ollama.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule, // ใช้ HttpModule ของ NestJS
    ConfigModule,
  ],
  providers: [OllamaService],
  exports: [OllamaService], // Export เพื่อให้ Module อื่น (Search, Posts) เรียกใช้ได้
})
export class OllamaModule {}
