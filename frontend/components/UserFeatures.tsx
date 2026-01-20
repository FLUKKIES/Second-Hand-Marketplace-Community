"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import {
  ChatFloatingWindow,
  ChatTrigger,
} from "@/components/chat/ChatFloatingWindow";

export function UserFeatures({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Admins don't need chat/socket features
  if (user?.role === "ADMIN") {
    return <>{children}</>;
  }

  // Regular users get full features
  return (
    <SocketProvider>
      <ChatProvider>
        <NotificationProvider>
          {children}
          <ChatFloatingWindow />
          <ChatTrigger />
        </NotificationProvider>
      </ChatProvider>
    </SocketProvider>
  );
}
