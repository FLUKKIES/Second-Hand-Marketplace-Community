import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class UsersService {
	constructor(
		private readonly prisma: PrismaService
	) { }

	// 1. ดูข้อมูลส่วนตัว (Me)
	async getMe(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				username: true,
				avatarUrl: true,
				bio: true,
				role: true,
				address: true,
				phoneNumber: true,
				createdAt: true,
			},
		});

		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	// 2. อัปเดตข้อมูลส่วนตัว
	async updateMe(userId: string, dto: UpdateUserDto) {
		const user = await this.prisma.user.update({
			where: { id: userId },
			data: {
				...dto,
			},
			select: {
				id: true,
				username: true,
				bio: true,
				address: true,
				phoneNumber: true,
			},
		});
		return user;
	}

	// 3. ดูโปรไฟล์คนอื่น (Public Profile - เช่น ดูคนขาย)
	async getPublicProfile(username: string) {
		const user = await this.prisma.user.findUnique({
			where: { username }, // ค้นหาด้วย username เพราะสวยกว่า ID ใน URL
			select: {
				id: true,
				username: true,
				avatarUrl: true,
				bio: true,
				createdAt: true,
				// ไม่ส่ง email, address, phone ของเขาไปให้คนนอกเห็น (Privacy)
				posts: {
					take: 5, // แถมโพสต์ล่าสุด 5 อันให้ด้วย
					where: { type: 'SALE' } // เฉพาะโพสต์ขายของ
				}
			},
		});

		if (!user) throw new NotFoundException('User not found');
		return user;
	}
}
