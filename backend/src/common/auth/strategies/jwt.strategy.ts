import { Injectable, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    return request?.cookies?.access_token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
        });
    }

    // ฟังก์ชันนี้จะทำงานถ้า Token ถูกต้อง -> return ข้อมูลเข้า req.user
    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isBanned: true, banExpiresAt: true, banReason: true }
        });

        if (!user) return null;

        if (user.isBanned) {
            // Check if ban expired
            if (user.banExpiresAt && new Date() > user.banExpiresAt) {
                // Auto unban logic could involve updating DB, but for now allow access?
                // Ideally we should update the DB. But validate method should be fast.
                // Maybe trigger an async update or just allow through and let a guard logic handle it?
                // For stricter implementation, we block if status is isBanned=true, unless we update it.
                // Let's just update it here if we can, or throw if we can't.
                // Ideally, we should unban them.
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { isBanned: false, banExpiresAt: null, banReason: null, bannedAt: null }
                });
                return { userId: user.id, email: user.email, role: user.role };
            }

            throw new ForbiddenException({
                message: 'Your account has been suspended',
                reason: user.banReason,
                expiresAt: user.banExpiresAt
            });
        }

        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}
