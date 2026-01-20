import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

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
            include: {
                group: {
                    include: {
                        _count: { select: { members: true, posts: true } }
                    }
                }
            }
        });
    }

    async update(id: string, dto: UpdateGroupDto) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) throw new NotFoundException('Group not found');

        return this.prisma.group.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                categoryId: dto.categoryId,
                imageUrl: dto.imageUrl,
            },
            include: {
                category: true,
                _count: { select: { members: true, posts: true } }
            }
        });
    }

    async remove(id: string) {
        // Check if group has any posts
        const postCount = await this.prisma.post.count({ where: { groupId: id } });
        if (postCount > 0) {
            throw new BadRequestException(`Cannot delete group with ${postCount} existing posts. Please delete posts first.`);
        }

        // Delete group (members cascade due to schema)
        return this.prisma.group.delete({ where: { id } });
    }
}
