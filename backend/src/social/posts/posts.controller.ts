import { Controller, Get, Post, Body, Param, UseGuards, Query, Delete, Patch } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { SearchPostDto } from 'src/common/search/dto/search-post.dto';
import { OptionalJwtAuthGuard } from 'src/common/auth/guards/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@GetUser('userId') userId: string, @Body() createPostDto: CreatePostDto) {
        return this.postsService.create(userId, createPostDto);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    update(@Param('id') id: string, @GetUser('userId') userId: string, @Body() updatePostDto: UpdatePostDto) {
        return this.postsService.update(userId, id, updatePostDto);
    }

    @Get()
    findAll(
        @Query('type') type?: 'NORMAL' | 'SELLING',
        @Query('categoryId') categoryId?: string,
        @Query('groupId') groupId?: string,
        @Query('authorId') authorId?: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '5',
    ) {
        return this.postsService.findAll({
            type,
            categoryId,
            groupId,
            authorId,
            page,
            limit
        });
    }

    @Get('search')
    search(@Query() dto: SearchPostDto) {
        return this.postsService.search(dto);
    }

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    findOne(@Param('id') id: string, @GetUser('userId') userId: string) {
        return this.postsService.findOne(id, userId);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    remove(@Param('id') id: string, @GetUser('userId') userId: string) {
        return this.postsService.remove(userId, id);
    }
}
