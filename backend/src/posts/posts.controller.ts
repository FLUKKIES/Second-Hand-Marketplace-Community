import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@GetUser('userId') userId: string, @Body() createPostDto: CreatePostDto) {
        return this.postsService.create(userId, createPostDto);
    }

    @Get()
    findAll() {
        return this.postsService.findAll();
    }

    @Post(':id/like') // POST /posts/uuid-123/like
    @UseGuards(AuthGuard('jwt'))
    toggleLike(@Param('id') postId: string, @GetUser('sub') userId: string) {
        return this.postsService.toggleLike(userId, postId);
    }
}