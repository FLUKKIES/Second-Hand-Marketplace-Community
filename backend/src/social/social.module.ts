import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { CommentsModule } from './comments/comments.module';
import { GroupsModule } from './groups/groups.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';

@Module({
  imports: [
    ChatModule,
    CommentsModule,
    GroupsModule,
    PostsModule,
    LikesModule,
  ],
  exports: [
    ChatModule,
    CommentsModule,
    GroupsModule,
    PostsModule,
    LikesModule,
  ],
})
export class SocialModule { }
