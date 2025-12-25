import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
	constructor(private prisma: PrismaService) { }

	// สร้างคอมเมนต์
	async create(userId: string, dto: CreateCommentDto) {
		// เช็คว่าโพสต์มีจริงไหม
		const post = await this.prisma.post.findUnique({ where: { id: dto.postId } });
		if (!post) throw new NotFoundException('Post not found');

		return this.prisma.comment.create({
			data: {
				content: dto.content,
				postId: dto.postId,
				userId: userId,
			},
			include: {
				user: { select: { username: true, avatarUrl: true } }, // return ผู้เขียนคอมเมนต์กลับไปเลย
			},
		});
	}

	// ลบคอมเมนต์ (เจ้าของเม้น หรือ เจ้าของโพสต์ ลบได้)
	async remove(userId: string, commentId: string) {
		const comment = await this.prisma.comment.findUnique({
			where: { id: commentId },
			include: { post: true }, // join ไปดูเจ้าของโพสต์ด้วย
		});

		if (!comment) throw new NotFoundException('Comment not found');

		// Logic: คนลบต้องเป็น "คนเขียนคอมเมนต์" หรือ "เจ้าของโพสต์"
		if (comment.userId !== userId && comment.post.authorId !== userId) {
			throw new ForbiddenException('You cannot delete this comment');
		}

		return this.prisma.comment.delete({ where: { id: commentId } });
	}

	// ดึงคอมเมนต์ของโพสต์ (Optional: ถ้าไม่ได้ดึงรวมกับ Post)
	async findByPostId(postId: string) {
		return this.prisma.comment.findMany({
			where: { postId },
			include: { user: { select: { username: true, avatarUrl: true } } },
			orderBy: { createdAt: 'asc' }
		});
	}
}
