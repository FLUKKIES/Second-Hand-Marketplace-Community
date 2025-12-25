import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmPaymentDto } from './dto/order-action.dto';
import { OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    // 1. Create Order (Buy Now)
    async createOrder(buyerId: string, dto: CreateOrderDto) {
        // Find all products
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
        // Map<SellerId, Items[]>
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
                        bankAccounts: {
                            include: { bank: true }
                        }
                    }
                });

                if (!seller) throw new NotFoundException('Seller not found');

                // Select default bank account or first one
                const bankAccount = seller.bankAccounts.find(b => b.isDefault) || seller.bankAccounts[0];
                
                // Construct snapshot (fallback to empty if no bank account - though usually should validate)
                const paymentSnapshot = {
                    sellerName: seller.username,
                    bankName: bankAccount ? bankAccount.bank.name : '',
                    bankAccount: bankAccount ? bankAccount.accountNumber : '',
                    promptPay: '' // PromptPay logic might need to be added to BankAccount model or verified
                };

                // Create Order
                const order = await tx.order.create({
                    data: {
                        buyerId: buyerId,
                        sellerId: sellerId,
                        totalPrice: totalOrderPrice,
                        status: OrderStatus.TO_PAY,
                        shippingAddress: dto.shippingAddress,
                        paymentSnapshot: paymentSnapshot as any,
                        items: {
                            create: orderItemsData
                        }
                    }
                });
                createdOrders.push(order);
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

        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.TO_SHIP,
                paymentSlipUrl: dto.slipUrl,
            },
        });
    }

    // 3. Seller Ship
    async markAsShipped(sellerId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) throw new NotFoundException('Order not found');
        if (order.sellerId !== sellerId) throw new ForbiddenException('Not your order');
        if (order.status !== OrderStatus.TO_SHIP) throw new BadRequestException('Order is not ready to ship');

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.TO_RECEIVE },
        });
    }

    // 4. Buyer Receive
    async markAsReceived(buyerId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) throw new NotFoundException('Order not found');
        if (order.buyerId !== buyerId) throw new ForbiddenException('Not your order');

        if (order.status !== OrderStatus.TO_RECEIVE) {
            // Actually, in some flows, we might skip TO_RECEIVE state if not strictly enforced. 
            // But let's assume standard flow: Pay -> Ship -> Receive -> Complete.
            // If it's TO_SHIP, buyer can't receive yet? Or maybe they can if looking at physical item.
            // Let's restrict to TO_RECEIVE for now.
             if (![OrderStatus.TO_SHIP, OrderStatus.TO_RECEIVE].includes(order.status as any)) {
                 throw new BadRequestException('Order cannot be completed at this stage');
             }
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.COMPLETED },
        });
    }

    // 5. Cancel Order
    async cancelOrder(userId: string, orderId: string) {
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
            // Update Status
            await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.CANCELLED },
            });

            // Restock
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        isSoldOut: false
                    }
                });
            }

            return { message: 'Order cancelled and stock restored' };
        });
    }

    // 6. Get My Orders (As Buyer)
    async getMyBuyingOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { buyerId: userId },
            include: {
                seller: { select: { username: true, avatarUrl: true } },
                items: { include: { product: true } }
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
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
