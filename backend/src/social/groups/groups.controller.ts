import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Body() dto: CreateGroupDto) {
        return this.groupsService.create(dto);
    }

    @Get()
    findAll(@Query('categoryId') categoryId?: string) {
        return this.groupsService.findAll(categoryId);
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
}
