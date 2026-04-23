export interface MessageReaction {
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    user: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    };
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    content: string;
    senderId: string;
    roomId: string;
    type: 'TEXT' | 'IMAGE';
    isRead: boolean;
    readAt?: string | null;
    createdAt: string;
    reactions?: MessageReaction[];
    sender?: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    };
}

export interface ChatRoom {
    id: string;
    initiatorId: string;
    recipientId: string;
    messages: ChatMessage[];
    initiator: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    };
    recipient: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    };
    updatedAt: string;
    unreadCount?: number;
}

