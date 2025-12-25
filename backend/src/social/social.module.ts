import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { CommentsModule } from './comments/comments.module';
import { GroupsModule } from './groups/groups.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ChatModule,
    CommentsModule,
    GroupsModule,
    PostsModule,
  ],
  exports: [
    ChatModule,
    CommentsModule,
    GroupsModule,
    PostsModule,
  ],
})
export class SocialModule {}
