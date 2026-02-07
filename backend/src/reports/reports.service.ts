import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportActionDto, ReportAction } from './dto/report-action.dto';
import { UsersService } from '../users/users.service';
import { ReportStatus, TargetType } from '@prisma/client';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
    ) { }

    async create(reporterId: string, dto: CreateReportDto) {
        // Validate target existence
        if (dto.targetType === TargetType.USER) {
            const user = await this.prisma.user.findUnique({ where: { id: dto.targetId } });
            if (!user) throw new NotFoundException('User not found');
        } else if (dto.targetType === TargetType.POST) {
            const post = await this.prisma.post.findUnique({ where: { id: dto.targetId } });
            if (!post) throw new NotFoundException('Post not found');
        } else if (dto.targetType === TargetType.GROUP) {
            const group = await this.prisma.group.findUnique({ where: { id: dto.targetId } });
            if (!group) throw new NotFoundException('Group not found');
        }

        return this.prisma.report.create({
            data: {
                reporterId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                reason: dto.reason,
            },
        });
    }

    async findAll(username?: string) {
        const where: any = {};

        if (username) {
            where.reporter = {
                username: {
                    contains: username,
                    mode: 'insensitive',
                },
            };
        }

        return this.prisma.report.findMany({
            where,
            include: {
                reporter: {
                    select: { id: true, username: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async takeAction(reportId: string, dto: ReportActionDto) {
        const report = await this.prisma.report.findUnique({ where: { id: reportId } });
        if (!report) throw new NotFoundException('Report not found');

        // Handle Sanctions
        if (report.targetType === TargetType.USER) {
            await this.handleUserSanction(report.targetId, dto);
        } else if (report.targetType === TargetType.POST && dto.action !== ReportAction.DISMISS) {
            // Find author of post to sanction? Or just delete post?
            // For now, let's assume we report Users mostly. 
            // If reporting post, we might want to sanction the author.
            const post = await this.prisma.post.findUnique({ where: { id: report.targetId } });
            if (post) {
                // Optional: Sanction author of post
            }
        }

        // Update Report Status
        const status = dto.action === ReportAction.DISMISS ? ReportStatus.DISMISSED : ReportStatus.RESOLVED;

        return this.prisma.report.update({
            where: { id: reportId },
            data: {
                status,
                adminNotes: dto.adminNotes,
            },
        });
    }

    private async handleUserSanction(userId: string, dto: ReportActionDto) {
        switch (dto.action) {
            case ReportAction.WARN:
                await this.usersService.warnUser(userId, dto.warningMessage || 'You have received a warning.');
                break;
            case ReportAction.TEMP_BAN:
                if (!dto.banDurationDays) throw new Error('Duration required for temp ban');
                await this.usersService.banUser(userId, dto.banDurationDays, dto.adminNotes);
                break;
            case ReportAction.PERMA_BAN:
                await this.usersService.banUser(userId, null, dto.adminNotes); // null duration = perma
                break;
            case ReportAction.DISMISS:
                // Do nothing to user
                break;
        }
    }
}
