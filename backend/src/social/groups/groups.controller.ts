import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/auth/decorator/get-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';
import { RolesGuard } from 'src/common/auth/guards/roles.guard';
import { Roles } from 'src/common/auth/decorator/roles.decorator';

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
