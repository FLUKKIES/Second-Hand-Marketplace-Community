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
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';
import { RolesGuard } from 'src/common/auth/guards/roles.guard';
import { Roles } from 'src/common/auth/decorator/roles.decorator';
import { OptionalJwtAuthGuard } from 'src/common/auth/guards/optional-jwt-auth.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('keyword') keyword?: string,
    @GetUser('userId') userId?: string,
  ) {
    return this.groupsService.findAll(categoryId, keyword, userId);
  }

  @Get('my-groups')
  @UseGuards(AuthGuard('jwt'))
  getMyGroups(@GetUser('userId') userId: string) {
    return this.groupsService.getMyGroups(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Get(':id/members')
  getMembers(@Param('id') groupId: string) {
    return this.groupsService.getMembers(groupId);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  join(@Param('id') groupId: string, @GetUser('userId') userId: string) {
    return this.groupsService.joinGroup(userId, groupId);
  }

  @Delete(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  leave(@Param('id') groupId: string, @GetUser('userId') userId: string) {
    return this.groupsService.leaveGroup(userId, groupId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}
