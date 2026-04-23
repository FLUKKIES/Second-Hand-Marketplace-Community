import React from "react";
import { ChatMessage } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  showAvatar?: boolean;
  currentUserId?: string;
}

export function MessageBubble({
  message,
  isMe,
  showAvatar = true,
  currentUserId,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2 group chat-message-group animate-slide-up",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      {/* Avatar for received messages */}
      {!isMe && showAvatar && (
        <Avatar className="chat-avatar mt-1">
          <AvatarImage src={api.getImageUrl(message.sender?.avatarUrl)} />
          <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-primary font-medium">
            {message.sender?.username.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      {!isMe && !showAvatar && <div className="chat-avatar" />}

      <div
        className={cn(
          "flex flex-col max-w-[var(--chat-bubble-max-width)]",
          isMe ? "items-end" : "items-start",
        )}
      >
        {/* Message bubble with improved styling */}
        <div
          className={cn(
            "chat-bubble text-sm break-words !max-w-full",
            isMe ? "chat-bubble-sent" : "chat-bubble-received",
          )}
        >
          {message.type === "IMAGE" ? (
            <img
              src={api.getImageUrl(message.content)}
              alt="Shared image"
              className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() =>
                window.open(api.getImageUrl(message.content), "_blank")
              }
            />
          ) : (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>

        {/* Time and read status with improved styling */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1",
            isMe ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-[11px] text-muted-foreground font-medium">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
          {isMe && (
            <span className="text-muted-foreground">
              {message.isRead ? (
                <CheckCheck size={14} className="text-blue-500" />
              ) : (
                <Check size={14} className="text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
