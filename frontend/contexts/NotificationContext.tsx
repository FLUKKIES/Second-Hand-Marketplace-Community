"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Notification, NotificationResponse } from "@/types";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: (page?: number) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    fetchNotifications: async () => {},
    markAsRead: async () => {},
    markAllAsRead: async () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchUnreadCount();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    // WebSocket Listener
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Show Toast
            toast(notification.title, {
                description: notification.message,
                action: {
                    label: "View",
                    onClick: () => console.log("Navigate to", notification), // TODO: Navigate based on data
                },
            });
        };

        socket.on('notification', handleNewNotification);

        return () => {
            socket.off('notification', handleNewNotification);
        };
    }, [socket]);

    const fetchNotifications = async (page = 1) => {
        try {
            setIsLoading(true);
            const response = await api.get<NotificationResponse>(`/notifications?page=${page}`);
            // If page 1, replace. If > 1, append (logic to be improved for strict pagination)
            if (page === 1) {
                setNotifications(response.data);
            } else {
                setNotifications((prev) => [...prev, ...response.data]);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get<{ count: number }>('/notifications/unread-count');
            setUnreadCount(response.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', getErrorMessage(error));
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', getErrorMessage(error));
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', getErrorMessage(error));
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
