"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { api } from "@/lib/api";
import { ChatRoom } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineStatus } from "./OnlineStatus";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

import { useSocket } from "@/contexts/SocketContext";

export function ChatList() {
  const { user } = useAuth();
  const { openChat, isUserOnline } = useChat();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleChatListUpdate = (message: any) => {
      console.log("Chat list update:", message);

      setRooms((prevRooms) => {
        const roomIndex = prevRooms.findIndex((r) => r.id === message.roomId);

        if (roomIndex === -1) {
          // New room created, refresh list
          fetchRooms();
          return prevRooms;
        }

        // Update existing room
        const room = prevRooms[roomIndex];
        const isMyMessage = message.senderId === user?.id;

        // If specific logic for active room is needed (e.g. don't increment if open),
        // that's usually handled by resetting count on open.
        // Here we just increment for the list view.
        const newUnreadCount = isMyMessage
          ? room.unreadCount || 0
          : (room.unreadCount || 0) + 1;

        const updatedRoom = {
          ...room,
          messages: [message, ...room.messages], // Newest message first
          unreadCount: newUnreadCount,
          updatedAt: message.createdAt,
        };

        // Move to top
        const otherRooms = prevRooms.filter((r) => r.id !== message.roomId);
        return [updatedRoom, ...otherRooms];
      });
    };

    socket.on("chatListUpdate", handleChatListUpdate);

    return () => {
      socket.off("chatListUpdate", handleChatListUpdate);
    };
  }, [socket, user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const rooms = await api.get<ChatRoom[]>("/chat/rooms");
      console.log("Fetched rooms:", rooms);

      // Deduplicate rooms by ID (in case backend returns duplicates)
      const uniqueRooms = rooms.filter(
        (room, index, self) =>
          index === self.findIndex((r) => r.id === room.id),
      );

      console.log("Unique rooms after dedup:", uniqueRooms);
      setRooms(uniqueRooms);
    } catch (error) {
      console.error("Failed to fetch chat rooms", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
        <p>No conversations yet.</p>
        <p className="text-xs">Start chatting from a product page!</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {rooms.map((room) => {
        // Determine the other user
        const otherUser =
          room.initiatorId === user?.id ? room.recipient : room.initiator;
        const lastMessage = room.messages[0];
        const hasUnread = (room.unreadCount ?? 0) > 0;

        return (
          <div
            key={room.id}
            className={cn(
              "flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 transition-colors relative",
              hasUnread && "bg-blue-50 hover:bg-blue-100",
            )}
            onClick={() => openChat(otherUser as any)}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={api.getImageUrl(otherUser.avatarUrl)} />
                <AvatarFallback>
                  {otherUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online status badge */}
              <div className="absolute bottom-0 right-0">
                <OnlineStatus isOnline={isUserOnline(otherUser.id)} size="sm" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span
                  className={cn(
                    "font-semibold text-sm truncate",
                    hasUnread && "text-blue-600",
                  )}
                >
                  {otherUser.username}
                </span>
                {lastMessage && (
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-xs truncate flex-1",
                    hasUnread ? "text-gray-700 font-medium" : "text-gray-500",
                  )}
                >
                  {lastMessage
                    ? (lastMessage.senderId === user?.id ? "You: " : "") +
                      lastMessage.content
                    : "No messages yet"}
                </p>
                {/* Unread badge */}
                {hasUnread && (
                  <span className="shrink-0 flex items-center justify-center h-5 w-5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                    {room.unreadCount! > 9 ? "9+" : room.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
