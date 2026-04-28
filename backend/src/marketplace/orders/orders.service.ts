import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderFromOffersDto } from './dto/create-order-from-offers.dto';
import { ConfirmPaymentDto, ShipOrderDto } from './dto/order-action.dto';
import { OrderStatus, OfferStatus, Prisma } from '@prisma/client';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // 1. Create Order (Buy Now)
  async createOrder(buyerId: string, dto: CreateOrderDto) {
    // *** NEW: Validate buyer has shipping address ***
    const buyerAddresses = await this.prisma.address.findMany({
      where: { userId: buyerId },
    });

    if (!buyerAddresses || buyerAddresses.length === 0) {
      throw new BadRequestException(
        'Please add a shipping address before placing an order',
      );
    }

    // ... (validation logic same as before) ...
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { post: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Some products not found');
    }

    // Validate products
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      if (product.post.authorId === buyerId) {
        throw new BadRequestException('Cannot buy your own product');
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Product ${product.name} is out of stock`,
        );
      }
    }

    // Group by Seller (Separate Order per Seller)
    const ordersBySeller = new Map<string, typeof dto.items>();

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
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
        const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
          [];

        for (const item of items) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            const itemTotal = Number(product.price) * item.quantity;
            totalOrderPrice += itemTotal;

            orderItemsData.push({
              productId: item.productId,
              price: product.price,
              quantity: item.quantity,
            });

            // Cut Stock
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                isSoldOut: product.stock - item.quantity <= 0,
              },
            });
          }
        }

        // Get Seller Bank Info for Snapshot
        const seller = await tx.user.findUnique({
          where: { id: sellerId },
          select: {
            username: true,
            bankAccounts: { include: { bank: true } },
          },
        });

        if (!seller) throw new NotFoundException('Seller not found');

        const bankAccount =
          seller.bankAccounts.find((b) => b.isDefault) ||
          seller.bankAccounts[0];

        const paymentSnapshot = {
          sellerName: seller.username,
          bankName: bankAccount ? bankAccount.bank.name : '',
          bankAccount: bankAccount ? bankAccount.accountNumber : '',
          promptPay: '',
        };

        // Create Order
        const order = await tx.order.create({
          data: {
            buyerId: buyerId,
            sellerId: sellerId,
            totalPrice: totalOrderPrice,
            status: OrderStatus.TO_VERIFY,
            shippingAddress: dto.shippingAddress,
            paymentSnapshot: paymentSnapshot as any,
            items: { create: orderItemsData },
            paymentSlipUrl: dto.paymentSlipUrl,
          },
        });
        createdOrders.push(order);

        // EMIT EVENT: Order Created (Notify Seller)
        this.eventEmitter.emit('order.created', {
          sellerId,
          orderId: order.id,
        });
      }

      return createdOrders;
    });
  }

  // 1b. Create Order from Accepted Offers (Multi-Offer Checkout)
  async createOrderFromOffers(buyerId: string, dto: CreateOrderFromOffersDto) {
    if (!dto.offerIds || dto.offerIds.length === 0) {
      throw new BadRequestException('Please select at least one offer');
    }

    // 1. Fetch all offers with relations
    const offers = await this.prisma.offer.findMany({
      where: {
        id: { in: dto.offerIds },
        buyerId: buyerId,
        status: OfferStatus.ACCEPTED,
        orderId: null,
      },
      include: {
        product: {
          include: {
            post: {
              select: { id: true, authorId: true, shippingCost: true },
            },
          },
        },
      },
    });

    // 2. Validate all offers found
    if (offers.length !== dto.offerIds.length) {
      throw new BadRequestException(
        'Some offers are invalid, already checked out, or not found',
      );
    }

    // 3. Validate all offers are from the same seller
    const sellerIds = new Set(offers.map((o) => o.product.post.authorId));
    if (sellerIds.size > 1) {
      throw new BadRequestException(
        'All selected offers must be from the same seller',
      );
    }
    const sellerId = offers[0].product.post.authorId;

    // 4. Get buyer's default shipping address
    const buyerAddresses = await this.prisma.address.findMany({
      where: { userId: buyerId },
    });

    if (!buyerAddresses || buyerAddresses.length === 0) {
      throw new BadRequestException(
        'Please add a shipping address before checkout',
      );
    }

    const defaultAddress =
      buyerAddresses.find((a) => a.isDefault) || buyerAddresses[0];
    const shippingAddress = `${defaultAddress.addressLine1}${defaultAddress.addressLine2 ? ', ' + defaultAddress.addressLine2 : ''}, ${defaultAddress.subDistrict}, ${defaultAddress.district}, ${defaultAddress.province} ${defaultAddress.postalCode}${defaultAddress.phoneNumber ? ' | Tel: ' + defaultAddress.phoneNumber : ''}`;

    // 5. Get seller bank account for payment snapshot
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        username: true,
        bankAccounts: { include: { bank: true } },
      },
    });

    if (!seller) throw new NotFoundException('Seller not found');

    const bankAccount =
      seller.bankAccounts.find((b) => b.isDefault) || seller.bankAccounts[0];

    if (!bankAccount) {
      throw new BadRequestException(
        'This seller has not set up a bank account yet. Please contact the seller or wait for them to add one before checking out.',
      );
    }

    const paymentSnapshot = {
      sellerName: seller.username,
      bankName: bankAccount.bank.name,
      bankAccount: bankAccount.accountNumber,
      promptPay: '',
    };

    // 6. Calculate total price (sum of final prices + max shipping cost)
    let itemsTotal = 0;
    let maxShippingCost = 0;

    for (const offer of offers) {
      const finalPrice = offer.counterPrice
        ? Number(offer.counterPrice)
        : Number(offer.offeredPrice);
      itemsTotal += finalPrice;

      const shippingCost = Number(offer.product.post.shippingCost) || 0;
      if (shippingCost > maxShippingCost) {
        maxShippingCost = shippingCost;
      }
    }

    const totalPrice = itemsTotal + maxShippingCost;

    // 7. Create Order in a transaction
    return this.prisma.$transaction(async (tx) => {
      const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
        offers.map((offer) => ({
          productId: offer.productId,
          price: offer.counterPrice ? offer.counterPrice : offer.offeredPrice,
          quantity: 1,
        }));

      const order = await tx.order.create({
        data: {
          buyerId: buyerId,
          sellerId: sellerId,
          totalPrice: totalPrice,
          status: OrderStatus.TO_VERIFY,
          shippingAddress: shippingAddress,
          paymentSnapshot: paymentSnapshot as any,
          paymentSlipUrl: dto.paymentSlipUrl,
          items: { create: orderItemsData },
          offers: {
            connect: dto.offerIds.map((id) => ({ id })),
          },
        },
        include: {
          items: { include: { product: true } },
          offers: true,
        },
      });

      this.eventEmitter.emit('order.created', {
        sellerId,
        orderId: order.id,
      });

      return order;
    });
  }

  // 2. Seller Verify Payment
  async verifyPayment(sellerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== sellerId)
      throw new ForbiddenException('Not your order');
    if (order.status !== OrderStatus.TO_VERIFY)
      throw new BadRequestException('Order status is not TO_VERIFY');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.TO_SHIP,
      },
    });

    // EMIT EVENT: Order Paid (Notify Buyer that payment is verified)
    this.eventEmitter.emit('order.paid', {
      buyerId: order.buyerId,
      orderId: order.id,
    });

    return updatedOrder;
  }

  // 3. Seller Ship & Update Tracking
  async markAsShipped(sellerId: string, orderId: string, dto: ShipOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.sellerId !== sellerId)
      throw new ForbiddenException('Not your order');

    // Allow if TO_SHIP (First time) OR TO_RECEIVE (Update tracking)
    if (
      order.status !== OrderStatus.TO_SHIP &&
      order.status !== OrderStatus.TO_RECEIVE
    ) {
      throw new BadRequestException(
        'Order cannot be shipped or updated at this stage',
      );
    }

    const isUpdate = order.status === OrderStatus.TO_RECEIVE;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.TO_RECEIVE, // Ensure status is TO_RECEIVE
        trackingNumber: dto.trackingNumber,
      },
    });

    // EMIT EVENT: Order Shipped (Notify Buyer) - Only if it's the first time
    // Or maybe emit "Tracking Updated" if it's an update?
    // For now, let's just emit the same event, the listener can decide or we can add a flag.
    // Actually, if it's an update, we might want to notify the buyer again that tracking changed.
    this.eventEmitter.emit('order.shipped', {
      buyerId: order.buyerId,
      orderId: order.id,
      trackingNumber: dto.trackingNumber,
      isUpdate,
    });

    return updatedOrder;
  }

  // 4. Buyer Receive
  async markAsReceived(buyerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId)
      throw new ForbiddenException('Not your order');

    if (order.status !== OrderStatus.TO_RECEIVE) {
      if (
        ![OrderStatus.TO_SHIP, OrderStatus.TO_RECEIVE].includes(
          order.status as any,
        )
      ) {
        throw new BadRequestException(
          'Order cannot be completed at this stage',
        );
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
    });

    // EMIT EVENT: Order Completed (Notify Seller)
    this.eventEmitter.emit('order.completed', {
      sellerId: order.sellerId,
      orderId: order.id,
    });

    return updatedOrder;
  }

  // 5. Cancel Order
  async cancelOrder(userId: string, orderId: string) {
    // ... (cancel logic) ...
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const isBuyer = order.buyerId === userId;
    const isSeller = order.sellerId === userId;

    if (!isBuyer && !isSeller)
      throw new ForbiddenException('Permission denied');

    if (
      [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(
        order.status as any,
      )
    ) {
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
            isSoldOut: false,
          },
        });
      }

      // EMIT EVENT: Order Cancelled (Notify the OTHER party)
      const targetUserId = isBuyer ? order.sellerId : order.buyerId;
      this.eventEmitter.emit('order.cancelled', {
        targetUserId,
        orderId: order.id,
        cancelledBy: isBuyer ? 'BUYER' : 'SELLER',
      });

      return { message: 'Order cancelled and stock restored' };
    });
  }

  // 6. Get My Orders (As Buyer)
  async getMyBuyingOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        items: { include: { product: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 7. Get My Orders (As Seller)
  async getMySellingOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { sellerId: userId },
      include: {
        buyer: { select: { id: true, username: true, avatarUrl: true } },
        items: { include: { product: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
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
        review: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Access Control: Only Buyer or Seller
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }
}
