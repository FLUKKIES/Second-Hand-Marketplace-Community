import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { BatchRespondDto, ActionType } from './dto/batch-respond.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    // =========================================================
    // 1. ผู้ซื้อ: กดจองสินค้า (ทำทีละชิ้น)
    // =========================================================
    async createRequest(buyerId: string, dto: CreateOrderRequestDto) {
        // 1. เช็คสินค้าว่ามีจริงและยังไม่ขาย
        const item = await this.prisma.saleItem.findUnique({
            where: { id: dto.saleItemId },
            include: { post: true },
        });

        if (!item) throw new NotFoundException('Item not found');
        if (item.isSoldOut || item.stock <= 0) throw new BadRequestException('Item is out of stock');
        if (item.post.authorId === buyerId) throw new BadRequestException('You cannot buy your own item');

        // 2. เช็คว่าเคยจองชิ้นนี้ไปแล้วหรือยัง (สถานะ PENDING)
        const existingReq = await this.prisma.orderRequest.findFirst({
            where: { buyerId, saleItemId: dto.saleItemId, status: 'PENDING' },
        });
        if (existingReq) throw new BadRequestException('You already requested this item');

        // 3. สร้างคำขอ
        return this.prisma.orderRequest.create({
            data: {
                buyerId,
                saleItemId: dto.saleItemId,
                status: 'PENDING',
            },
            include: { saleItem: true },
        });
    }

    // =========================================================
    // 2. ผู้ขาย: ตอบรับหลายรายการพร้อมกัน (Bundle Order)
    // =========================================================
    async batchRespond(sellerId: string, dto: BatchRespondDto) {

        // 1. ดึงข้อมูล Request ทั้งหมดตาม ID ที่ส่งมา
        const requests = await this.prisma.orderRequest.findMany({
            where: { id: { in: dto.requestIds } },
            include: {
                saleItem: { include: { post: true } },
                buyer: true
            },
        });

        // --- Validation Zone ---

        // A. เช็คจำนวนว่าเจอครบไหม
        if (requests.length !== dto.requestIds.length) {
            throw new NotFoundException('Some requests not found');
        }

        // B. เช็คว่าเป็นของผู้ซื้อคนเดียวกันทั้งหมดไหม (สำคัญมาก! ไม่งั้นรวมบิลไม่ได้)
        const firstBuyerId = requests[0].buyerId;
        const isSameBuyer = requests.every(req => req.buyerId === firstBuyerId);
        if (!isSameBuyer) throw new BadRequestException('All requests must belong to the same buyer to be bundled');

        // C. เช็คว่าคนกด Approve เป็นเจ้าของสินค้าทุกชิ้นไหม
        const isOwner = requests.every(req => req.saleItem.post.authorId === sellerId);
        if (!isOwner) throw new ForbiddenException('You are not the owner of some items');

        // D. เช็คสถานะต้องเป็น PENDING เท่านั้น
        const isPending = requests.every(req => req.status === 'PENDING');
        if (!isPending) throw new BadRequestException('Some requests are already processed');


        // --- Action Zone ---

        // กรณี REJECT: ปรับสถานะเป็น REJECTED ทั้งหมด
        if (dto.action === ActionType.REJECT) {
            await this.prisma.orderRequest.updateMany({
                where: { id: { in: dto.requestIds } },
                data: { status: 'REJECTED' },
            });
            return { message: 'Requests rejected', count: requests.length };
        }

        // กรณี APPROVE: สร้าง Order + ตัดสต็อก
        if (dto.action === ActionType.APPROVE) {
            return this.prisma.$transaction(async (tx) => {

                // 1. คำนวณราคารวม
                const totalPrice = requests.reduce((sum, req) => sum + Number(req.saleItem.price), 0);

                // 2. สร้าง Order ใบใหญ่ 1 ใบ
                const order = await tx.order.create({
                    data: {
                        buyerId: firstBuyerId,
                        totalPrice: totalPrice,
                        status: 'TO_PAY', // รอผู้ซื้อจ่ายเงิน

                        // สร้าง OrderItems ย่อยข้างใน
                        items: {
                            create: requests.map((req) => ({
                                saleItemId: req.saleItemId,
                                price: req.saleItem.price, // ล็อกราคา ณ ตอนขาย
                                quantity: 1,
                            })),
                        },
                    },
                });

                // 3. อัปเดตสถานะ Request เป็น APPROVED และเชื่อมโยงกับ Order
                await tx.orderRequest.updateMany({
                    where: { id: { in: dto.requestIds } },
                    data: {
                        status: 'APPROVED',
                        orderId: order.id, // เชื่อมโยงกลับไปบอกว่า Order นี้เกิดจาก Request ใบไหนบ้าง
                    },
                });

                // 4. วนลูปตัดสต็อกสินค้าทีละชิ้น
                for (const req of requests) {
                    // เช็คสต็อกอีกรอบเพื่อความชัวร์ (เผื่อ Transaction ชนกัน)
                    if (req.saleItem.stock <= 0) {
                        throw new BadRequestException(`Item "${req.saleItem.name}" is out of stock`);
                    }

                    const updatedItem = await tx.saleItem.update({
                        where: { id: req.saleItemId },
                        data: { stock: { decrement: 1 } },
                    });

                    // ถ้าสต็อกเหลือ 0 ให้ขึ้นป้าย Sold Out
                    if (updatedItem.stock <= 0) {
                        await tx.saleItem.update({
                            where: { id: req.saleItemId },
                            data: { isSoldOut: true },
                        });
                    }
                }

                return {
                    message: 'Bundle order created successfully',
                    orderId: order.id,
                    totalPrice
                };
            });
        }
    }

    // =========================================================
    // 3. Helper: ดูรายการขอซื้อ (Incoming Requests)
    // =========================================================
    async getIncomingRequests(userId: string) {
        // ค้นหา Request ที่สินค้าเป็นของฉัน และสถานะ PENDING
        return this.prisma.orderRequest.findMany({
            where: {
                saleItem: { post: { authorId: userId } },
                status: 'PENDING'
            },
            include: {
                buyer: { select: { id: true, username: true, avatarUrl: true } },
                saleItem: { select: { id: true, name: true, price: true, imageUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // =========================================================
    // 4. Helper: ดูรายการที่ฉันไปขอซื้อเขา (My Requests)
    // =========================================================
    async getMyRequests(userId: string) {
        return this.prisma.orderRequest.findMany({
            where: { buyerId: userId },
            include: {
                saleItem: { select: { name: true, price: true, imageUrl: true } },
                order: true // ดูด้วยว่า request นี้กลายเป็น order หรือยัง
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}