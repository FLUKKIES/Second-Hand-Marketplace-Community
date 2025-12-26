import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
    constructor(
        private prisma: PrismaService,
        private gateway: NotificationGateway
    ) { }

    async createNotification(userId: string, type: NotificationType, title: string, message: string, data?: any) {
        // 1. Save to DB
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: data || {},
            },
        });

        // 2. Push Real-time
        this.gateway.sendToUser(userId, 'notification', notification);

        return notification;
    }

    async getUserNotifications(userId: string, page = 1) {
        const take = 20;
        const skip = (page - 1) * take;

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.notification.count({ where: { userId } })
        ]);

        const unreadCount = await this.prisma.notification.count({
            where: { userId, isRead: false }
        });

        return {
            data: notifications,
            meta: {
                total,
                page,
                totalPages: Math.ceil(total / take),
                unreadCount
            }
        };
    }

    async markAsRead(id: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    }

    // --- Event Listeners (Decoupled Logic) ---

    // --- Event Listeners (Decoupled Logic) ---

    @OnEvent('order.created')
    async handleOrderCreated(payload: { sellerId: string, orderId: string }) {
        await this.createNotification(
            payload.sellerId,
            NotificationType.ORDER_CREATED,
            'New Order Received',
            'You have a new order waiting for payment.',
            { orderId: payload.orderId }
        );
    }

    @OnEvent('order.paid')
    async handleOrderPaid(payload: { sellerId: string, orderId: string }) {
        await this.createNotification(
            payload.sellerId,
            NotificationType.ORDER_PAID,
            'Order Paid',
            'Buyer has confirmed payment. Please check and ship.',
            { orderId: payload.orderId }
        );
    }

    @OnEvent('order.shipped')
    async handleOrderShipped(payload: { buyerId: string, orderId: string }) {
        await this.createNotification(
            payload.buyerId,
            NotificationType.ORDER_SHIPPED,
            'Order Shipped',
            'Your order has been shipped.',
            { orderId: payload.orderId }
        );
    }

    @OnEvent('order.completed')
    async handleOrderCompleted(payload: { sellerId: string, orderId: string }) {
        await this.createNotification(
            payload.sellerId,
            NotificationType.ORDER_COMPLETED,
            'Order Completed',
            'Buyer received the order. Transaction completed.',
            { orderId: payload.orderId }
        );
    }

    @OnEvent('order.cancelled')
    async handleOrderCancelled(payload: { targetUserId: string, orderId: string, cancelledBy: string }) {
        await this.createNotification(
            payload.targetUserId,
            NotificationType.ORDER_CANCELLED,
            'Order Cancelled',
            `Order has been cancelled by ${payload.cancelledBy}.`,
            { orderId: payload.orderId }
        );
    }

    @OnEvent('offer.received')
    async handleOfferReceived(payload: { sellerId: string, offerId: string }) {
        await this.createNotification(
            payload.sellerId,
            NotificationType.OFFER_RECEIVED,
            'New Offer Received',
            'Someone made an offer for your product.',
            { offerId: payload.offerId }
        );
    }

    @OnEvent('offer.accepted')
    async handleOfferAccepted(payload: { buyerId: string, offerId: string, orderId: string }) {
        await this.createNotification(
            payload.buyerId,
            NotificationType.OFFER_ACCEPTED,
            'Offer Accepted',
            'Your offer has been accepted! An order has been created.',
            { offerId: payload.offerId, orderId: payload.orderId }
        );
    }

    @OnEvent('offer.rejected')
    async handleOfferRejected(payload: { buyerId: string, offerId: string }) {
        await this.createNotification(
            payload.buyerId,
            NotificationType.OFFER_REJECTED,
            'Offer Rejected',
            'Your offer was rejected by the seller.',
            { offerId: payload.offerId }
        );
    }
}
