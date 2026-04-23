"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@/types";
import { useSocket } from "./SocketContext";

interface ChatContextType {
    isOpen: boolean;
    activeRoomId: string | null;
    recipient: User | null; // The user we are chatting with (useful for header)
    openChat: (recipient?: User | null) => void;
    closeChat: () => void;
    minimizeChat: () => void;
    expandChat: () => void;
    isMinimized: boolean;
    isUserOnline: (userId: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { socket, isConnected } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [recipient, setRecipient] = useState<User | null>(null);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    // Handle online status
    useEffect(() => {
        if (!socket || !isConnected) return;

        // Fetch initial list
        socket.emit("getOnlineUsers", (users: string[]) => {
            if (Array.isArray(users)) {
                setOnlineUserIds(new Set(users));
            }
        });

        // Listen for updates
        const handleUserOnline = ({ userId }: { userId: string }) => {
            setOnlineUserIds((prev) => new Set(prev).add(userId));
        };

        const handleUserOffline = ({ userId }: { userId: string }) => {
            setOnlineUserIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        };

        socket.on("userOnline", handleUserOnline);
        socket.on("userOffline", handleUserOffline);

        return () => {
            socket.off("userOnline", handleUserOnline);
            socket.off("userOffline", handleUserOffline);
        };
    }, [socket, isConnected]);

    const openChat = (user?: User | null) => {
        setRecipient(user || null);
        setIsOpen(true);
        setIsMinimized(false);
        if (!user) {
            setActiveRoomId(null);
        }
    };

    const closeChat = () => {
        setIsOpen(false);
        setActiveRoomId(null);
        setRecipient(null);
    };

    const minimizeChat = () => setIsMinimized(true);
    const expandChat = () => setIsMinimized(false);

    const isUserOnline = (userId: string) => onlineUserIds.has(userId);

    return (
        <ChatContext.Provider
            value={{
                isOpen,
                activeRoomId,
                openChat,
                closeChat,
                recipient,
                minimizeChat,
                expandChat,
                isMinimized,
                isUserOnline,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
