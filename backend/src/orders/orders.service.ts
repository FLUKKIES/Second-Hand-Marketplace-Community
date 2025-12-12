import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { BatchRespondDto, ActionType } from './dto/batch-respond.dto';
import { ConfirmPaymentDto } from './dto/order-action.dto';

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

    // 2. Batch Respond (แก้ไข: เพิ่ม Payment Snapshot)
    async batchRespond(sellerId: string, dto: BatchRespondDto) {
        const requests = await this.prisma.orderRequest.findMany({
            where: { id: { in: dto.requestIds } },
            include: { saleItem: { include: { post: true } } },
        });

        if (requests.length !== dto.requestIds.length) throw new NotFoundException('Some requests not found');

        const firstBuyerId = requests[0].buyerId;
        if (!requests.every(req => req.buyerId === firstBuyerId)) throw new BadRequestException('Different buyers');
        if (!requests.every(req => req.saleItem.post.authorId === sellerId)) throw new ForbiddenException('Not owner');
        if (!requests.every(req => req.status === 'PENDING')) throw new BadRequestException('Processed requests');

        if (dto.action === ActionType.REJECT) {
            await this.prisma.orderRequest.updateMany({
                where: { id: { in: dto.requestIds } },
                data: { status: 'REJECTED' },
            });
            return { message: 'Requests rejected' };
        }

        if (dto.action === ActionType.APPROVE) {
            // *** NEW: ดึงข้อมูลการชำระเงินของคนขาย มา Snapshot ***
            const seller = await this.prisma.user.findUnique({
                where: { id: sellerId },
                select: { bankName: true, bankAccount: true, promptPay: true }
            });

            // *** เพิ่มส่วนนี้ครับ: เช็คก่อนว่า User นี้มีตัวตนไหม ***
            if (!seller) {
                throw new NotFoundException('Seller profile not found');
            }
            // *************************************************

            // พอผ่านบรรทัดบนมาได้ TypeScript จะรู้แล้วว่า seller ไม่มีทางเป็น null
            // ตรวจสอบว่าคนขายตั้งค่าบัญชีหรือยัง?
            if (!seller.bankAccount && !seller.promptPay) {
                throw new BadRequestException('Please setup your Bank Account or PromptPay in profile before accepting orders.');
            }

            return this.prisma.$transaction(async (tx) => {
                const totalPrice = requests.reduce((sum, req) => sum + Number(req.saleItem.price), 0);

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
                        orderRequests: { connect: dto.requestIds.map(id => ({ id })) },

                        // *** Snapshot ข้อมูลลง JSON ***
                        paymentSnapshot: seller as any,
                    },
                });

                await tx.orderRequest.updateMany({
                    where: { id: { in: dto.requestIds } },
                    data: { status: 'APPROVED' },
                });

                for (const req of requests) {
                    if (req.saleItem.stock <= 0) throw new BadRequestException(`Item ${req.saleItem.name} out of stock`);
                    const updatedItem = await tx.saleItem.update({
                        where: { id: req.saleItemId },
                        data: { stock: { decrement: 1 } },
                    });
                    if (updatedItem.stock <= 0) {
                        await tx.saleItem.update({ where: { id: req.saleItemId }, data: { isSoldOut: true } });
                    }
                }

                return { message: 'Order created', orderId: order.id };
            });
        }
    }

    // ==========================================
    // 3. Buyer Pay: แจ้งโอนเงิน + แนบสลิป
    // ==========================================
    async confirmPayment(buyerId: string, orderId: string, dto: ConfirmPaymentDto) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) throw new NotFoundException('Order not found');
        if (order.buyerId !== buyerId) throw new ForbiddenException('Not your order');
        if (order.status !== 'TO_PAY') throw new BadRequestException('Order status is not TO_PAY');

        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'TO_SHIP',
                paymentSlipUrl: dto.slipUrl, // บันทึกสลิป
            },
        });
    }

    // ==========================================
    // 4. Seller Ship: กดส่งของ
    // ==========================================
    async markAsShipped(sellerId: string, orderId: string) {
        // ต้อง Join เพื่อเช็คว่าเป็น Seller ของ Order นี้จริงไหม
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { saleItem: { include: { post: true } } } } }
        });

        if (!order) throw new NotFoundException('Order not found');

        // เช็คจาก item ชิ้นแรกว่าเป็นของ Seller คนนี้ไหม
        const isSeller = order.items[0].saleItem.post.authorId === sellerId;
        if (!isSeller) throw new ForbiddenException('You are not the seller');

        if (order.status !== 'TO_SHIP') throw new BadRequestException('Order is not ready to ship');

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'TO_RECEIVE' },
        });
    }

    // ==========================================
    // 5. Buyer Receive: กดรับสินค้า
    // ==========================================
    async markAsReceived(buyerId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) throw new NotFoundException('Order not found');
        if (order.buyerId !== buyerId) throw new ForbiddenException('Not your order');

        // อนุญาตให้กดรับได้แม้จะข้ามขั้นตอน (เผื่อรับของก่อนมากดในแอป)
        if (!['TO_SHIP', 'TO_RECEIVE'].includes(order.status)) {
            throw new BadRequestException('Order cannot be completed at this stage');
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'COMPLETED' },
        });
    }

    // ==========================================
    // 6. Cancel: ยกเลิกออเดอร์ (คืนสต็อก)
    // ==========================================
    async cancelOrder(userId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { saleItem: { include: { post: true } } } }
            }
        });

        if (!order) throw new NotFoundException('Order not found');

        // Logic: ใครมีสิทธิ์ยกเลิกบ้าง?
        const isBuyer = order.buyerId === userId;
        const isSeller = order.items[0].saleItem.post.authorId === userId;

        if (!isBuyer && !isSeller) throw new ForbiddenException('Permission denied');

        // ถ้าออเดอร์จบไปแล้ว หรือยกเลิกไปแล้ว ห้ามแก้
        if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
            throw new BadRequestException('Cannot cancel finished order');
        }

        // เริ่ม Transaction การคืนของ
        return this.prisma.$transaction(async (tx) => {
            // A. อัปเดตสถานะเป็น CANCELLED
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' },
            });

            // B. คืนสต็อก (Restock)
            for (const item of order.items) {
                await tx.saleItem.update({
                    where: { id: item.saleItemId },
                    data: {
                        stock: { increment: item.quantity }, // เพิ่มสต็อกคืน
                        isSoldOut: false, // ปลดป้าย Sold Out (ถ้ามี)
                    },
                });
            }

            return { message: 'Order cancelled and stock restored' };
        });
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