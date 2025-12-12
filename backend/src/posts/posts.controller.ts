import { Controller, Get, Post, Body, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { SearchPostDto } from './dto/search-post.dto';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@GetUser('userId') userId: string, @Body() createPostDto: CreatePostDto) {
        return this.postsService.create(userId, createPostDto);
    }

    @Get()
    findAll(
        @Query('type') type?: 'GENERAL' | 'SALE',
        @Query('categoryId') categoryId?: string
    ) {
        return this.postsService.findAll({ type, categoryId });
    }

    @Get('search')
    search(@Query() dto: SearchPostDto) {
        return this.postsService.search(dto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    remove(@Param('id') id: string, @GetUser('userId') userId: string) {
        return this.postsService.remove(userId, id);
    }
}