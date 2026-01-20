import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { SearchModule } from 'src/common/search/search.module';
import { UploadModule } from 'src/common/upload/upload.module';

@Module({
  imports: [SearchModule, UploadModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule { }
