import { Controller, Post, Body, UseGuards, Delete, Param, Get } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorator/get-user.decorator';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@GetUser('userId') userId: string, @Body() dto: CreateCommentDto) {
        return this.commentsService.create(userId, dto);
    }

    @Get('post/:postId') // GET /comments/post/uuid-123
    findByPostId(@Param('postId') postId: string) {
        return this.commentsService.findByPostId(postId);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    remove(@Param('id') id: string, @GetUser('userId') userId: string) {
        return this.commentsService.remove(userId, id);
    }
}