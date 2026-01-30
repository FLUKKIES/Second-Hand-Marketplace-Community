"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL || !user?.id) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    console.log("Initializing socket connection for user:", user.id);

    if (user) {
      const newSocket = io(baseUrl, {
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ["polling", "websocket"], // Standard: polling first, then upgrade
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (err: any) => {
        console.error(
          "Socket connection warning:",
          err?.message || "Unknown socket error",
        );
      });

      setSocket(newSocket);

      // โค้ดตรงนี้จะทำงานก็ต่อเมื่อ...มีการเปลี่ยนแปลง user?.id หรือไม่มี user?.id
      return () => {
        console.log("Cleaning up socket...");
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
