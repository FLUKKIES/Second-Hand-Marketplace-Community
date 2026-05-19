import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OptionalJwtAuthGuard } from 'src/common/auth/guards/optional-jwt-auth.guard';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/common/auth/guards/roles.guard';
import { Roles } from 'src/common/auth/decorator/roles.decorator';
import { Role } from '@prisma/client';
import { BanUserDto } from './dto/ban-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================
  // Private Routes (ต้อง Login)
  // ============================

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@GetUser('userId') userId: string) {
    return this.usersService.getMe(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateMe(@GetUser('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/consent')
  acceptTerms(@GetUser('userId') userId: string) {
    return this.usersService.acceptTerms(userId);
  }

  // ============================
  // Public Routes (ใครก็ดูได้)
  // ============================

  @Get('search')
  search(@Query('keyword') keyword: string) {
    return this.usersService.search(keyword || '');
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':username')
  getProfile(
    @Param('username') username: string,
    @GetUser('userId') userId?: string,
  ) {
    return this.usersService.getPublicProfile(username, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/follow')
  followUser(
    @GetUser('userId') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.usersService.followUser(followerId, followingId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/follow')
  unfollowUser(
    @GetUser('userId') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.usersService.unfollowUser(followerId, followingId);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }

  // ============================
  // Admin Routes
  // ============================

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/:id')
  getAdminUserDetail(@Param('id') id: string) {
    return this.usersService.getAdminUserDetail(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/ban')
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.usersService.banUser(id, dto.durationDays || null, dto.reason);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/unban')
  unbanUser(@Param('id') id: string) {
    return this.usersService.unbanUser(id);
  }
}
