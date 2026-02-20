import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { PostType, Role, NotificationType } from '@prisma/client';
import { NotificationService } from 'src/common/notification/notification.service';

@Injectable()
export class UsersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notificationService: NotificationService
	) { }

	// 1. ดูข้อมูลส่วนตัว (Me)
	async getMe(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				username: true,
				firstName: true,
				lastName: true,
				avatarUrl: true,
				bio: true,
				role: true,
				warningCount: true,
				phoneNumber: true,
				acceptedTermsAt: true,
				createdAt: true,
				addresses: true,
				bankAccounts: {
					include: {
						bank: true
					}
				}
			},
		});

		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	// 2. อัปเดตข้อมูลส่วนตัว
	async updateMe(userId: string, dto: UpdateUserDto) {
		try {
			const user = await this.prisma.user.update({
				where: { id: userId },
				data: {
					...dto,
				},
				select: {
					id: true,
					username: true,
					firstName: true,
					lastName: true,
					bio: true,
					phoneNumber: true,
					addresses: true,
				},
			});
			return user;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ForbiddenException('Credentials taken');
				}
			}
			throw error;
		}
	}

	async acceptTerms(userId: string) {
		return this.prisma.user.update({
			where: { id: userId },
			data: {
				acceptedTermsAt: new Date()
			}
		});
	}

	// 3. ดูโปรไฟล์คนอื่น (Public Profile - เช่น ดูคนขาย)
	async getPublicProfile(username: string, currentUserId?: string) {
		// First get the target user to find their ID
		const targetUser = await this.prisma.user.findUnique({
			where: { username },
			select: { id: true }
		});

		if (!targetUser) throw new NotFoundException('User not found');

		const user = await this.prisma.user.findUnique({
			where: { username }, // ค้นหาด้วย username เพราะสวยกว่า ID ใน URL
			select: {
				id: true,
				username: true,
				firstName: true,
				lastName: true,
				avatarUrl: true,
				bio: true,
				createdAt: true,
				warningCount: true,
				// ไม่ส่ง email, address, phone ของเขาไปให้คนนอกเห็น (Privacy)
				posts: {
					take: 10, // แถมโพสต์ล่าสุด 5 อันให้ด้วย
					where: { type: PostType.SELLING }, // เฉพาะโพสต์ขายของ
					orderBy: { createdAt: 'desc' }
				},
				_count: {
					select: {
						followedBy: true, // followers count
						following: true,  // following count
					}
				}
			},
		});

		if (!user) throw new NotFoundException('User not found');


		let isFollowing = false;

		if (currentUserId) {
			const follow = await this.prisma.follow.findUnique({
				where: {
					followerId_followingId: {
						followerId: currentUserId,
						followingId: targetUser.id,
					}
				}
			});
			isFollowing = !!follow;
		}

		// Calculate Average Rating
		const ratings = await this.prisma.review.aggregate({
			where: { targetId: user.id },
			_avg: { rating: true },
			_count: { rating: true }
		});

		return {
			...user,
			followersCount: user._count.followedBy,
			followingCount: user._count.following,
			isFollowing,
			rating: ratings._avg.rating || 0,
			reviewCount: ratings._count.rating || 0
		};
	}

	async followUser(followerId: string, followingId: string) {
		if (followerId === followingId) {
			throw new Error("You cannot follow yourself");
		}

		return this.prisma.follow.create({
			data: {
				followerId,
				followingId
			}
		});
	}

	async unfollowUser(followerId: string, followingId: string) {
		return this.prisma.follow.delete({
			where: {
				followerId_followingId: {
					followerId,
					followingId
				}
			}
		});
	}

	async getFollowers(userId: string) {
		return this.prisma.follow.findMany({
			where: { followingId: userId },
			include: {
				follower: {
					select: {
						id: true,
						username: true,
						avatarUrl: true,
						firstName: true,
						lastName: true,
					}
				}
			}
		});
	}

	async getFollowing(userId: string) {
		return this.prisma.follow.findMany({
			where: { followerId: userId },
			include: {
				following: {
					select: {
						id: true,
						username: true,
						avatarUrl: true,
						firstName: true,
						lastName: true,
					}
				}
			}
		});
	}
	// ... existing methods ...

	async search(keyword: string) {
		return this.prisma.user.findMany({
			where: {
				OR: [
					{ username: { contains: keyword, mode: 'insensitive' } },
					{ firstName: { contains: keyword, mode: 'insensitive' } },
					{ lastName: { contains: keyword, mode: 'insensitive' } },
					{ email: { contains: keyword, mode: 'insensitive' } },
				],
				role: Role.USER
			},
			take: 20,
			select: {
				id: true,
				username: true,
				firstName: true,
				lastName: true,
				avatarUrl: true,
				bio: true,
				role: true,
				isBanned: true,
				banReason: true,
				warningCount: true,
			}
		});
	}
	// ... (search method)

	async getAdminUserDetail(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: {
				addresses: true,
				bankAccounts: {
					include: { bank: true }
				}
			}
		});
		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	// 4. Moderation Methods
	async warnUser(userId: string, message: string) {
		// Increment warning count
		await this.prisma.user.update({
			where: { id: userId },
			data: {
				warningCount: { increment: 1 }
			}
		});

		// Create Notification
		await this.notificationService.createNotification(
			userId,
			NotificationType.WARNING_RECEIVED,
			"Warning from Admin",
			message
		);

		return { success: true };
	}

	async banUser(userId: string, durationDays: number | null, reason?: string) {
		let banExpiresAt: Date | null = null;
		if (durationDays) {
			const date = new Date();
			date.setDate(date.getDate() + durationDays);
			banExpiresAt = date;
		}

		return this.prisma.user.update({
			where: { id: userId },
			data: {
				isBanned: true,
				bannedAt: new Date(),
				banExpiresAt: banExpiresAt,
				banReason: reason,
			}
		});
	}

	async unbanUser(userId: string) {
		return this.prisma.user.update({
			where: { id: userId },
			data: {
				isBanned: false,
				bannedAt: null,
				banExpiresAt: null,
				banReason: null,
			}
		});
	}
}
