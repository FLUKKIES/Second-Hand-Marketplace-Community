import { Controller, Post, Param, UseGuards, Get } from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';

@Controller('likes')
export class LikesController {
    constructor(private readonly likesService: LikesService) { }

    @Post(':postId')
    @UseGuards(AuthGuard('jwt'))
    toggleLike(@Param('postId') postId: string, @GetUser('userId') userId: string) {
        return this.likesService.toggleLike(userId, postId);
    }

    @Get('post/:postId/check')
    @UseGuards(AuthGuard('jwt'))
    checkLike(@Param('postId') postId: string, @GetUser('userId') userId: string) {
        return this.likesService.checkLike(userId, postId);
    }
}
