import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { CommentsModule } from './comments/comments.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { ChatModule } from './chat/chat.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), '.', 'public'),
            serveRoot: '/',
            serveStaticOptions: {
                index: false,
            }
        }),
        PrismaModule,
        UsersModule,
        PostsModule,
        AuthModule,
        UploadModule,
        CommentsModule,
        OrdersModule,
        CategoriesModule,
        ChatModule,
        ReviewsModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
