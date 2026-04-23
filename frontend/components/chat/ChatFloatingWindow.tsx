"use client";

import React, { useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useSocket } from "@/contexts/SocketContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Minus, ChevronUp } from "lucide-react";
import { ChatList } from "./ChatList";
import { ChatRoom } from "./ChatRoom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function ChatFloatingWindow() {
    const { isOpen, isMinimized, closeChat, minimizeChat, expandChat, activeRoomId, recipient, openChat } = useChat();
    const { user } = useAuth();

    if (!user) return null; // Don't show if not logged in

    if (!isOpen) {
        // Floating Bubble when closed (optional, maybe we only want to show it when explicitly opened or have a permanent bubble)
        // For now, let's assume we have a permanent functionality in the navbar, but we can also have a bubble.
        // Let's hide it completely if closed, assuming trigger is elsewhere.
        // BUT, usually a chat system has a persistent bubble. Let's add one.
        return null; 
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button 
                    className="rounded-full h-14 w-14 shadow-lg bg-primary text-white hover:bg-primary/90"
                    onClick={expandChat}
                >
                    <MessageCircle size={28} />
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 w-80 md:w-96 bg-white border border-gray-200 shadow-2xl rounded-t-xl overflow-hidden flex flex-col transition-all duration-300",
            "h-[500px]" // Fixed height
        )}>
            {/* Header */}
            <div className="bg-primary p-3 flex justify-between items-center text-white shrink-0">
                <div className="font-semibold flex items-center gap-2">
                    <MessageCircle size={20} />
                    <span>{recipient ? recipient.username : "Messages"}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={minimizeChat}>
                        <Minus size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={closeChat}>
                        <X size={16} />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-gray-50 flex flex-col">
                {activeRoomId || recipient ? (
                    <ChatRoom />
                ) : (
                    <ChatList />
                )}
            </div>
        </div>
    );
}

// Separate component for the trigger button if needed globally, but user logic said useChat is triggered by other means potentially.
// But we should probably have a persistent trigger if the user has minimized it.
export function ChatTrigger() {
    const { isOpen, openChat } = useChat();
    const { user } = useAuth();
    
    // If we want a global floating button that is always visible:
    if (isOpen || !user) return null;

    return (
         <div className="fixed bottom-4 right-4 z-50">
            <Button 
                className="rounded-full h-14 w-14 shadow-lg bg-primary text-white hover:bg-primary/90"
                onClick={() => openChat(null as any)} // Open list
            >
                <MessageCircle size={28} />
            </Button>
        </div>
    )
}
