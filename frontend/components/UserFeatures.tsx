"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import {
  ChatFloatingWindow,
  ChatTrigger,
} from "@/components/chat/ChatFloatingWindow";

import { ConsentModal } from "@/components/auth/ConsentModal";

export function UserFeatures({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Admins don't need chat/socket features AND don't need consent modal
  if (user?.role === "ADMIN") {
    return <>{children}</>;
  }

  // Regular users get full features including consent modal
  return (
    <SocketProvider>
      <ChatProvider>
        <NotificationProvider>
          {children}
          <ConsentModal />
          <ChatFloatingWindow />
          <ChatTrigger />
        </NotificationProvider>
      </ChatProvider>
    </SocketProvider>
  );
}
