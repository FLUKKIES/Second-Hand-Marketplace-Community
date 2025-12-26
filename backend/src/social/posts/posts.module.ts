import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { SearchModule } from 'src/common/search/search.module';

@Module({
  imports: [SearchModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule { }
