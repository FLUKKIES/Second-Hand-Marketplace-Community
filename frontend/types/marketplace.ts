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
    paymentSlipUrl?: string | null;
    shippingAddress?: string;
    trackingNumber?: string | null;
    paymentDueAt?: string | null;
    updatedAt: string;
    offers?: Offer[];
    review?: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
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
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTER_OFFERED" | "EXPIRED" | "CANCELLED";
    buyerNote?: string;
    sellerNote?: string;
    negotiationNote?: string;   // Latest note from whoever countered last
    lastCounteredBy?: "BUYER" | "SELLER"; // Whose turn it is to respond when COUNTER_OFFERED
    counterCount?: number;
    expiresAt: string;
    createdAt: string;
    orderId?: string | null;
    product: {
        id: string;
        postId: string;
        name: string;
        price: string;
        description: string;
        imageUrl: string | null;
        post?: {
            id: string;
            shippingCost: string;
            authorId: string;
            author: {
                id: string;
                username: string;
                avatarUrl: string | null;
            };
        };
    };
    buyer: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
}
