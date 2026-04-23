export enum NotificationType {
    OFFER_RECEIVED = 'OFFER_RECEIVED',
    OFFER_ACCEPTED = 'OFFER_ACCEPTED',
    OFFER_REJECTED = 'OFFER_REJECTED',
    ORDER_CREATED = 'ORDER_CREATED',
    ORDER_PAID = 'ORDER_PAID',
    ORDER_SHIPPED = 'ORDER_SHIPPED',
    ORDER_COMPLETED = 'ORDER_COMPLETED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    SYSTEM = 'SYSTEM'
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationResponse {
    data: Notification[];
    meta: {
        total: number;
        page: number;
        totalPages: number;
        unreadCount: number;
    };
}
