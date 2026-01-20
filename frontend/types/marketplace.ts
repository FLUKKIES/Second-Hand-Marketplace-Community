export type OfferStatus = 'PENDING' | 'COUNTER_OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type OrderStatus = 'TO_PAY' | 'TO_SHIP' | 'TO_RECEIVE' | 'COMPLETED' | 'CANCELLED';

export interface Product {
    id: string;
    name: string;
    description?: string | null;
    price: string;
    imageUrl?: string | null;
    stock: number;
    isSoldOut: boolean;
    postId: string;
}

export interface Offer {
    id: string;
    buyerId: string;
    productId: string;
    offeredPrice: string;
    buyerNote?: string | null;
    sellerNote?: string | null;
    counterPrice?: string | null;
    counterNote?: string | null;
    counterCount: number;
    status: OfferStatus;
    expiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
    product: Product & {
        post: {
            authorId: string;
            author: {
                username: string;
                avatarUrl?: string | null;
            };
        };
    };
    buyer?: {
        username: string;
        avatarUrl?: string | null;
    };
}

export interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: string;
    product: Product;
}

export interface Order {
    id: string;
    buyerId: string;
    sellerId: string;
    totalPrice: string;
    status: OrderStatus;
    shippingAddress: string;
    paymentSnapshot: {
        sellerName: string;
        bankName: string;
        bankAccount: string;
        promptPay?: string;
    };
    paymentSlipUrl?: string | null;
    trackingNumber?: string | null;
    items: OrderItem[];
    buyer?: {
        username: string;
        avatarUrl?: string | null;
    };
    seller?: {
        username: string;
        avatarUrl?: string | null;
    };
    review?: {
        id: string;
        rating: number;
        comment?: string | null;
        createdAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}
