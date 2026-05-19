import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { PrismaModule } from 'src/common/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
