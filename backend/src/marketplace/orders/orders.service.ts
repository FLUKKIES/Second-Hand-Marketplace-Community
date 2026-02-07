import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmPaymentDto, ShipOrderDto } from './dto/order-action.dto';
import { OrderStatus, Prisma } from '@prisma/client';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2
    ) { }

    // 1. Create Order (Buy Now)
    async createOrder(buyerId: string, dto: CreateOrderDto) {
        // *** NEW: Validate buyer has shipping address ***
        const buyerAddresses = await this.prisma.address.findMany({
            where: { userId: buyerId }
        });

        if (!buyerAddresses || buyerAddresses.length === 0) {
            throw new BadRequestException('Please add a shipping address before placing an order');
        }

        // ... (validation logic same as before) ...
        const productIds = dto.items.map(i => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { post: true }
        });

        if (products.length !== productIds.length) {
            throw new NotFoundException('Some products not found');
        }

        // Validate products
        for (const item of dto.items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) continue;

            if (product.post.authorId === buyerId) {
                throw new BadRequestException('Cannot buy your own product');
            }
            if (product.stock < item.quantity) {
                throw new BadRequestException(`Product ${product.name} is out of stock`);
            }
        }

        // Group by Seller (Separate Order per Seller)
        const ordersBySeller = new Map<string, typeof dto.items>();

        for (const item of dto.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const sellerId = product.post.authorId;
                if (!ordersBySeller.has(sellerId)) {
                    ordersBySeller.set(sellerId, []);
                }
                ordersBySeller.get(sellerId)?.push(item);
            }
        }

        // Create Orders Transaction
        return this.prisma.$transaction(async (tx) => {
            const createdOrders: any[] = [];

            for (const [sellerId, items] of ordersBySeller.entries()) {
                // Calculate total
                let totalOrderPrice = 0;
                const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

                for (const item of items) {
                    const product = products.find(p => p.id === item.productId);
                    if (product) {
                        const itemTotal = Number(product.price) * item.quantity;
                        totalOrderPrice += itemTotal;

                        orderItemsData.push({
                            productId: item.productId,
                            price: product.price,
                            quantity: item.quantity
                        });

                        // Cut Stock
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: { decrement: item.quantity },
                                isSoldOut: (product.stock - item.quantity) <= 0
                            }
                        });
                    }
                }

                // Get Seller Bank Info for Snapshot
                const seller = await tx.user.findUnique({
                    where: { id: sellerId },
                    select: {
                        username: true,
                        bankAccounts: { include: { bank: true } }
                    }
                });

                if (!seller) throw new NotFoundException('Seller not found');

                const bankAccount = seller.bankAccounts.find(b => b.isDefault) || seller.bankAccounts[0];

                const paymentSnapshot = {
                    sellerName: seller.username,
                    bankName: bankAccount ? bankAccount.bank.name : '',
                    bankAccount: bankAccount ? bankAccount.accountNumber : '',
                    promptPay: ''
                };

                const paymentDueAt = new Date();
                paymentDueAt.setHours(paymentDueAt.getHours() + 24);

                // Create Order
                const order = await tx.order.create({
                    data: {
                        buyerId: buyerId,
                        sellerId: sellerId,
                        totalPrice: totalOrderPrice,
                        status: OrderStatus.TO_PAY,
                        shippingAddress: dto.shippingAddress,
                        paymentSnapshot: paymentSnapshot as any,
                        items: { create: orderItemsData },
                        paymentDueAt
                    }
                });
                createdOrders.push(order);

                // EMIT EVENT: Order Created (Notify Seller)
                this.eventEmitter.emit('order.created', {
                    sellerId,
                    orderId: order.id
                });
            }

            return createdOrders;
        });
    }

    // 2. Buyer Pay
    async confirmPayment(buyerId: string, orderId: string, dto: ConfirmPaymentDto) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) throw new NotFoundException('Order not found');
        if (order.buyerId !== buyerId) throw new ForbiddenException('Not your order');
        if (order.status !== OrderStatus.TO_PAY) throw new BadRequestException('Order status is not TO_PAY');

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.TO_SHIP,
                paymentSlipUrl: dto.slipUrl,
            },
        });

        // EMIT EVENT: Order Paid (Notify Seller)
        this.eventEmitter.emit('order.paid', {
            sellerId: order.sellerId,
            orderId: order.id
        });

        return updatedOrder;
    }

    // 3. Seller Ship
    async markAsShipped(sellerId: string, orderId: string, dto: ShipOrderDto) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) throw new NotFoundException('Order not found');
        if (order.sellerId !== sellerId) throw new ForbiddenException('Not your order');
        if (order.status !== OrderStatus.TO_SHIP) throw new BadRequestException('Order is not ready to ship');

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.TO_RECEIVE,
                trackingNumber: dto.trackingNumber
            },
        });

        // EMIT EVENT: Order Shipped (Notify Buyer)
        this.eventEmitter.emit('order.shipped', {
            buyerId: order.buyerId,
            orderId: order.id,
            trackingNumber: dto.trackingNumber
        });

        return updatedOrder;
    }

    // 4. Buyer Receive
    async markAsReceived(buyerId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) throw new NotFoundException('Order not found');
        if (order.buyerId !== buyerId) throw new ForbiddenException('Not your order');

        if (order.status !== OrderStatus.TO_RECEIVE) {
            if (![OrderStatus.TO_SHIP, OrderStatus.TO_RECEIVE].includes(order.status as any)) {
                throw new BadRequestException('Order cannot be completed at this stage');
            }
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.COMPLETED },
        });

        // EMIT EVENT: Order Completed (Notify Seller)
        this.eventEmitter.emit('order.completed', {
            sellerId: order.sellerId,
            orderId: order.id
        });

        return updatedOrder;
    }

    // 5. Cancel Order
    async cancelOrder(userId: string, orderId: string) {
        // ... (cancel logic) ...
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) throw new NotFoundException('Order not found');

        const isBuyer = order.buyerId === userId;
        const isSeller = order.sellerId === userId;

        if (!isBuyer && !isSeller) throw new ForbiddenException('Permission denied');

        if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status as any)) {
            throw new BadRequestException('Cannot cancel finished order');
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.CANCELLED },
            });

            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        isSoldOut: false
                    }
                });
            }

            // EMIT EVENT: Order Cancelled (Notify the OTHER party)
            const targetUserId = isBuyer ? order.sellerId : order.buyerId;
            this.eventEmitter.emit('order.cancelled', {
                targetUserId,
                orderId: order.id,
                cancelledBy: isBuyer ? 'BUYER' : 'SELLER'
            });

            return { message: 'Order cancelled and stock restored' };
        });
    }

    // 6. Get My Orders (As Buyer)
    async getMyBuyingOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { buyerId: userId },
            include: {
                seller: { select: { username: true, avatarUrl: true } },
                items: { include: { product: true } },
                review: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 7. Get My Orders (As Seller)
    async getMySellingOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { sellerId: userId },
            include: {
                buyer: { select: { username: true, avatarUrl: true } },
                items: { include: { product: true } },
                review: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // 8. Get Single Order (Buyer or Seller)
    async getOrderById(userId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                buyer: { select: { id: true, username: true, avatarUrl: true } },
                seller: { select: { id: true, username: true, avatarUrl: true } },
                items: { include: { product: true } },
                review: true
            }
        });

        if (!order) throw new NotFoundException('Order not found');

        // Access Control: Only Buyer or Seller
        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new ForbiddenException('You do not have permission to view this order');
        }

        return order;
    }
    // 8. Cron Job: Expire Unpaid Orders
    @Cron(CronExpression.EVERY_MINUTE)
    async handlePaymentCron() {
        const now = new Date();
        const overdueOrders = await this.prisma.order.findMany({
            where: {
                status: OrderStatus.TO_PAY,
                paymentDueAt: { lt: now }
            },
            include: { items: true }
        });

        if (overdueOrders.length === 0) return;

        console.log(`[Cron] Found ${overdueOrders.length} overdue orders`);

        for (const order of overdueOrders) {
            await this.prisma.$transaction(async (tx) => {
                // Cancel Order
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: OrderStatus.CANCELLED }
                });

                // Restore Stock
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.quantity },
                            isSoldOut: false
                        }
                    });
                }
            });

            // Emit Event
            this.eventEmitter.emit('order.cancelled', {
                targetUserId: order.buyerId, // Notify Buyer
                orderId: order.id,
                cancelledBy: 'SYSTEM'
            });

            this.eventEmitter.emit('order.cancelled', {
                targetUserId: order.sellerId, // Notify Seller
                orderId: order.id,
                cancelledBy: 'SYSTEM'
            });
        }
    }
}
