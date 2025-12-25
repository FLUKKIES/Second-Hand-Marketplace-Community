import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateGroupDto) {
        return this.prisma.group.create({
            data: {
                name: dto.name,
                categoryId: dto.categoryId,
                description: dto.description,
                imageUrl: dto.imageUrl,
            }
        });
    }

    async findAll(categoryId?: string) {
        const where = categoryId ? { categoryId: parseInt(categoryId) } : {};
        return this.prisma.group.findMany({
            where,
            include: {
                category: true,
                _count: { select: { members: true, posts: true } }
            }
        });
    }

    async findOne(id: string) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: {
                category: true,
                _count: { select: { members: true, posts: true } }
            }
        });
        if (!group) throw new NotFoundException('Group not found');
        return group;
    }

    async joinGroup(userId: string, groupId: string) {
        // Check if group exists
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        // Check if already member
        const membership = await this.prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId
                }
            }
        });

        if (membership) throw new BadRequestException('Already joined this group');

        return this.prisma.groupMember.create({
            data: {
                userId,
                groupId,
                role: 'MEMBER'
            }
        });
    }

    async leaveGroup(userId: string, groupId: string) {
        return this.prisma.groupMember.delete({
            where: {
                userId_groupId: {
                    userId,
                    groupId
                }
            }
        });
    }

    async getMyGroups(userId: string) {
        return this.prisma.groupMember.findMany({
            where: { userId },
            include: { group: true }
        });
    }
}
