import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { OllamaModule } from '../ai/ollama/ollama.module';
import { PrismaModule } from 'src/common/database/prisma/prisma.module';

@Module({
  imports: [OllamaModule, PrismaModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
