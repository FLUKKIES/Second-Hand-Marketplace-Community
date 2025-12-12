import { Controller, Get, Post, Body, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@GetUser('sub') userId: string, @Body() createPostDto: CreatePostDto) {
        return this.postsService.create(userId, createPostDto);
    }

    @Get()
    findAll(
        @Query('type') type?: 'GENERAL' | 'SALE',
        @Query('categoryId') categoryId?: string
    ) {
        return this.postsService.findAll({ type, categoryId });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    remove(@Param('id') id: string, @GetUser('sub') userId: string) {
        return this.postsService.remove(userId, id);
    }
}