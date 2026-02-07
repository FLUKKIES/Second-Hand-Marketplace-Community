export interface Order {
    id: string;
    buyerId: string;
    sellerId: string;
    totalPrice: number;
    status: "TO_PAY" | "TO_SHIP" | "TO_RECEIVE" | "COMPLETED" | "CANCELLED";
    items: OrderItem[];
    buyer?: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    seller?: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    createdAt: string;
    paymentSnapshot?: {
        bankName: string;
        sellerName: string;
        bankAccount: string;
    } | null;
}

export interface OrderItem {
    id: string;
    productId: string;
    product: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
    quantity: number;
    price: number;
}

export interface Offer {
    id: string;
    offeredPrice: string;
    counterPrice?: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTER_OFFERED" | "EXPIRED";
    buyerNote?: string;
    counterNote?: string;
    expiresAt: string;
    createdAt: string;
    product: {
        id: string;
        postId: string;
        name: string;
        price: string;
        description: string;
        imageUrl: string | null;
    };
    buyer: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
}
