import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { BatchRespondDto, ActionType } from './dto/batch-respond.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    // 1. ผู้ซื้อจอง (ต้องเช็ค deletedAt ของโพสต์ด้วย)
    async createRequest(buyerId: string, dto: CreateOrderRequestDto) {
        const item = await this.prisma.saleItem.findUnique({
            where: { id: dto.saleItemId },
            include: { post: true },
        });

        if (!item) throw new NotFoundException('Item not found');

        // *** เช็คเพิ่ม: ถ้าโพสต์ถูกลบไปแล้ว ห้ามซื้อ ***
        if (item.post.deletedAt) throw new BadRequestException('This post has been deleted');
        if (item.isSoldOut || item.stock <= 0) throw new BadRequestException('Item is out of stock');
        if (item.post.authorId === buyerId) throw new BadRequestException('You cannot buy your own item');

        const existingReq = await this.prisma.orderRequest.findFirst({
            where: { buyerId, saleItemId: dto.saleItemId, status: 'PENDING' },
        });
        if (existingReq) throw new BadRequestException('You already requested this item');

        return this.prisma.orderRequest.create({
            data: { buyerId, saleItemId: dto.saleItemId, status: 'PENDING' },
            include: { saleItem: true },
        });
    }

    // 2. ผู้ขายตอบรับแบบ Bundle (รวมออเดอร์)
    async batchRespond(sellerId: string, dto: BatchRespondDto) {
        const requests = await this.prisma.orderRequest.findMany({
            where: { id: { in: dto.requestIds } },
            include: { saleItem: { include: { post: true } } },
        });

        if (requests.length !== dto.requestIds.length) throw new NotFoundException('Some requests not found');

        const firstBuyerId = requests[0].buyerId;
        if (!requests.every(req => req.buyerId === firstBuyerId)) {
            throw new BadRequestException('All requests must belong to the same buyer');
        }
        if (!requests.every(req => req.saleItem.post.authorId === sellerId)) {
            throw new ForbiddenException('Not owner of some items');
        }
        if (!requests.every(req => req.status === 'PENDING')) {
            throw new BadRequestException('Requests already processed');
        }

        if (dto.action === ActionType.REJECT) {
            await this.prisma.orderRequest.updateMany({
                where: { id: { in: dto.requestIds } },
                data: { status: 'REJECTED' },
            });
            return { message: 'Requests rejected' };
        }

        if (dto.action === ActionType.APPROVE) {
            return this.prisma.$transaction(async (tx) => {
                const totalPrice = requests.reduce((sum, req) => sum + Number(req.saleItem.price), 0);

                // สร้าง Order ใหญ่
                const order = await tx.order.create({
                    data: {
                        buyerId: firstBuyerId,
                        totalPrice: totalPrice,
                        status: 'TO_PAY',
                        items: {
                            create: requests.map((req) => ({
                                saleItemId: req.saleItemId,
                                price: req.saleItem.price,
                                quantity: 1,
                            })),
                        },
                        orderRequests: {
                            connect: dto.requestIds.map(id => ({ id }))
                        }
                    },
                });

                // Update สถานะ Request
                await tx.orderRequest.updateMany({
                    where: { id: { in: dto.requestIds } },
                    data: { status: 'APPROVED' },
                });

                // ตัดสต็อก
                for (const req of requests) {
                    if (req.saleItem.stock <= 0) throw new BadRequestException(`Item ${req.saleItem.name} out of stock`);

                    const updatedItem = await tx.saleItem.update({
                        where: { id: req.saleItemId },
                        data: { stock: { decrement: 1 } },
                    });

                    if (updatedItem.stock <= 0) {
                        await tx.saleItem.update({
                            where: { id: req.saleItemId },
                            data: { isSoldOut: true },
                        });
                    }
                }

                return { message: 'Bundle order created', orderId: order.id };
            });
        }
    }

    async getIncomingRequests(userId: string) {
        return this.prisma.orderRequest.findMany({
            where: { saleItem: { post: { authorId: userId } }, status: 'PENDING' },
            include: { buyer: true, saleItem: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getMyRequests(userId: string) {
        return this.prisma.orderRequest.findMany({
            where: { buyerId: userId },
            include: { saleItem: true, order: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}