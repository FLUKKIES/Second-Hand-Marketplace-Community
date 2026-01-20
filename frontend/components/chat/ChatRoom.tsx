"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useSocket } from "@/contexts/SocketContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  X,
} from "lucide-react";
import { ChatMessage, ChatRoom as ChatRoomType } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { OnlineStatus } from "./OnlineStatus";

export function ChatRoom() {
  const { user } = useAuth();
  const { recipient, openChat } = useChat();
  const { socket } = useSocket();

  // Local state for messages and room ID
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  // TODO: Implement image upload later
  // const [selectedImage, setSelectedImage] = useState<File | null>(null);
  // const [imagePreview, setImagePreview] = useState<string | null>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  // Initialize room when recipient changes
  useEffect(() => {
    if (!socket || !recipient) return;

    // Prevent double calls in React Strict Mode
    let isJoining = false;

    const joinRoom = () => {
      if (isJoining) {
        console.log("Already joining, skipping...");
        return;
      }

      isJoining = true;
      console.log("Joining room with:", recipient.id);
      setInitializing(true);
      setMessages([]);
      setRoomId(null);
      setOtherUserTyping(false);

      // Clear any existing timeout
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }

      // Set timeout for joinRoom
      joinTimeoutRef.current = setTimeout(() => {
        console.error("Join room timeout");
        setInitializing(false);
        setRoomId("error"); // Set error state
        isJoining = false;
      }, 10000); // 10 second timeout

      // Emit joinRoom event with proper callback
      socket.emit("joinRoom", recipient.id, (response: any) => {
        // Clear timeout on response
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
        }

        isJoining = false;

        if (!response) {
          console.error("No response from server");
          setInitializing(false);
          setRoomId("error");
          return;
        }

        if (response.event === "joined") {
          // Wait for history event to set messages
          setRoomId(response.data.roomId);
        } else if (response.event === "error") {
          console.error("Server returned error:", response.data);
          setInitializing(false);
          setRoomId("error");
        } else {
          console.error("Unexpected response format:", response);
          setInitializing(false);
          setRoomId("error");
        }
      });

      // Check online status
      socket.emit(
        "checkOnlineStatus",
        { userId: recipient.id },
        (response: any) => {
          if (response) {
            setIsOnline(response.isOnline);
          }
        },
      );
    };

    joinRoom();

    // Listen for history event
    const handleHistory = (roomData: ChatRoomType) => {
      console.log("Received history event:", roomData);

      // Clear timeout if history received (also counts as success)
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }

      if (roomData && roomData.messages) {
        setMessages([...roomData.messages].reverse());
        setInitializing(false); // Stop loading when history is ready
        // Also ensure roomId is set if not already
        if (!roomId) setRoomId(roomData.id);

        // Mark all messages as read when opening room
        if (socket && roomData.id) {
          socket.emit("markAsRead", { roomId: roomData.id });
        }
      }
    };

    socket.on("history", handleHistory);

    return () => {
      isJoining = false;
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
      socket.off("history", handleHistory);
    };
  }, [recipient?.id, socket]); // Only depend on recipient.id, not entire object

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      console.log("New message received:", message);
      setMessages((prev) => {
        // If message already exists (duplicates), ignore
        if (prev.some((m) => m.id === message.id)) return prev;

        // If it's my message, try to find the optimistic one and replace it
        if (message.senderId === user?.id) {
          const optimisticMatchIndex = prev.findIndex(
            (m) => m.id.startsWith("temp-") && m.content === message.content,
          );

          if (optimisticMatchIndex !== -1) {
            const newMessages = [...prev];
            newMessages[optimisticMatchIndex] = message;
            return newMessages;
          }
        }

        return [...prev, message];
      });

      // Mark as read immediately when joining room
      if (message.senderId !== user?.id && roomId) {
        socket.emit("markAsRead", { roomId });
      }
    };

    const handleTyping = (data: { userId: string }) => {
      if (data.userId === recipient?.id) {
        setOtherUserTyping(true);
      }
    };

    const handleStopTyping = (data: { userId: string }) => {
      if (data.userId === recipient?.id) {
        setOtherUserTyping(false);
      }
    };

    const handleMessagesRead = () => {
      // Update messages to mark as read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === user?.id
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg,
        ),
      );
    };

    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === recipient?.id) {
        setIsOnline(true);
      }
    };

    const handleUserOffline = (data: { userId: string }) => {
      if (data.userId === recipient?.id) {
        setIsOnline(false);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStopTyping);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStopTyping);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
  }, [socket, user?.id, recipient?.id, roomId]);

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!socket || !roomId) return;

    // Emit typing event
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("userTyping", { roomId });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("userStoppedTyping", { roomId });
    }, 1000);
  };

  // TODO: Implement image upload later
  // const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file && file.type.startsWith('image/')) {
  //     setSelectedImage(file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // const handleRemoveImage = () => {
  //   setSelectedImage(null);
  //   setImagePreview(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };

  const handleSend = () => {
    if (!inputText.trim() || !roomId || !socket) return;

    const content = inputText;
    const tempId = `temp-${Date.now()}`;

    // Optimistic Update
    const tempMessage: ChatMessage = {
      id: tempId,
      roomId: roomId,
      senderId: user?.id || "",
      content: content,
      isRead: false,
      readAt: null,
      type: "TEXT",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputText("");

    const payload = {
      roomId,
      content: content,
    };

    socket.emit("sendMessage", payload);

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      socket.emit("userStoppedTyping", { roomId });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="animate-spin mb-2" />
        <span className="text-xs">Loading chat...</span>
      </div>
    );
  }

  if (!roomId || roomId === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-3">
        <div className="text-red-500 text-sm font-semibold">
          Failed to join room
        </div>
        <div className="text-xs text-gray-500 max-w-xs">
          We couldn't connect to the chat room. This might be due to a
          connection issue or a temporary server error.
          <br />
          <br />
          Please try again. If the problem persists, try refreshing the page.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRoomId(null);
            setInitializing(true);
            // Retry
            window.location.reload();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header with online status */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => openChat(null as any)}
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="flex-1">
          <p className="font-semibold text-sm">{recipient?.username}</p>
          <OnlineStatus isOnline={isOnline} showText size="sm" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.id;
          const prevMsg = messages[index - 1];
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={isMe}
              showAvatar={showAvatar}
              currentUserId={user?.id}
            />
          );
        })}
        {otherUserTyping && <TypingIndicator username={recipient?.username} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
        {/* Image Preview */}
        {/* {imagePreview && (
          <div className="mb-2 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )} */}

        {/* TODO: Implement image upload later */}
        {/* <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-primary shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={20} />
        </Button> */}
        <Input
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="h-9 w-9 shrink-0 rounded-full"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
