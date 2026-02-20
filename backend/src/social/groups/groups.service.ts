import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UploadService } from 'src/common/upload/upload.service';

@Injectable()
export class GroupsService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService // Inject UploadService
    ) { }

    async create(dto: CreateGroupDto) {
        return this.prisma.group.create({
            data: {
                name: dto.name,
                categoryId: dto.categoryId,
                description: dto.description,
                imageUrl: dto.imageUrl,
                backgroundUrl: dto.backgroundUrl,
            }
        });
    }

    async findAll(categoryId?: string, keyword?: string, userId?: string) {
        const where: any = {};

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (keyword) {
            where.name = {
                contains: keyword,
                mode: 'insensitive'
            };
        }

        const groups = await this.prisma.group.findMany({
            where,
            include: {
                category: true,
                _count: { select: { members: true, posts: true } },
                // If userId exists, check if they are a member
                members: userId ? {
                    where: { userId },
                    select: { userId: true }
                } : false
            },
            orderBy: [
                { category: { name: 'asc' } }, // List according to category
                { name: 'asc' }
            ]
        });

        // Map to include isJoined flag
        return groups.map(group => ({
            ...group,
            isJoined: userId ? group.members.length > 0 : false,
            members: undefined // Hide members list from response to be clean
        }));
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

    async getMembers(groupId: string) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        return this.prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: [
                { role: 'asc' },
                { joinedAt: 'asc' },
            ],
        });
    }

    async update(id: string, dto: UpdateGroupDto) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) throw new NotFoundException('Group not found');

        // Delete old image if updating
        if (dto.imageUrl && group.imageUrl && dto.imageUrl !== group.imageUrl) {
            await this.uploadService.deleteFile(group.imageUrl);
        }

        // Delete old background if updating
        if (dto.backgroundUrl && group.backgroundUrl && dto.backgroundUrl !== group.backgroundUrl) {
            await this.uploadService.deleteFile(group.backgroundUrl);
        }

        return this.prisma.group.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                categoryId: dto.categoryId,
                imageUrl: dto.imageUrl,
                backgroundUrl: dto.backgroundUrl,
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

        // Get group info to delete image
        const group = await this.prisma.group.findUnique({ where: { id } });

        if (group) {
            if (group.imageUrl) {
                await this.uploadService.deleteFile(group.imageUrl);
            }
            if (group.backgroundUrl) {
                await this.uploadService.deleteFile(group.backgroundUrl);
            }
        }

        // Delete group (members cascade due to schema)
        return this.prisma.group.delete({ where: { id } });
    }
}
