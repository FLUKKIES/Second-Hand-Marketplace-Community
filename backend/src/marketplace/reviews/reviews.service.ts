import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async create(reviewerId: string, dto: CreateReviewDto) {
        // 1. ตรวจสอบออเดอร์
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: {
                items: { include: { product: { include: { post: true } } } } // เพื่อหาเจ้าของสินค้า (Seller)
            }
        });

        if (!order) throw new NotFoundException('Order not found');

        // 2. เช็คสิทธิ์: คนรีวิวต้องเป็นคนซื้อ
        if (order.buyerId !== reviewerId) throw new ForbiddenException('You are not the buyer');

        // 3. เช็คสถานะ: ต้อง COMPLETED เท่านั้นถึงรีวิวได้
        if (order.status !== 'COMPLETED') throw new BadRequestException('Order is not completed yet');

        // 4. หา Seller ID (จากสินค้าชิ้นแรกในออเดอร์)
        const sellerId = order.items[0].product.post.authorId;
        if (sellerId === reviewerId) throw new BadRequestException('Cannot review yourself'); // กันเหนียว

        // 5. สร้างรีวิว
        return this.prisma.review.create({
            data: {
                rating: dto.rating,
                comment: dto.comment,
                reviewerId: reviewerId,
                targetId: sellerId, // ให้เครดิตคนขาย
                orderId: dto.orderId,
            },
        });
    }

    // ดูรีวิวของ User คนนั้น (เช่น ดูรีวิวพ่อค้า)
    async getUserReviews(userId: string) {
        const reviews = await this.prisma.review.findMany({
            where: { targetId: userId },
            include: {
                reviewer: { select: { username: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' }
        });

        // คำนวณคะแนนเฉลี่ยแถมไปให้ด้วย
        const average = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
            averageRating: parseFloat(average.toFixed(1)), // ทศนิยม 1 ตำแหน่ง
            totalReviews: reviews.length,
            reviews: reviews
        };
    }
}
