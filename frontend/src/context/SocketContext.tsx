import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthContext } from "./AuthContext";

const socketUrl = import.meta.env.VITE_API_URL;

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const newSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: false
    });

    setSocket(newSocket);

    if (user) {
      newSocket.connect();
      console.log("🟢 Bật Socket kết nối vì đã đăng nhập!");
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
