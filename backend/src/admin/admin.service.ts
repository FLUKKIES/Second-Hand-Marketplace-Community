
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const totalUsers = await this.prisma.user.count();

        return {
            totalUsers,
        };
    }
}
