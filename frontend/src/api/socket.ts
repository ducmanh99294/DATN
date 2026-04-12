// src/api/socket.ts
import { io, Socket } from "socket.io-client";
const socketUrl = import.meta.env.VITE_API_URL;

let socket: Socket;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  socket = io(socketUrl, {
    auth: { token }
  });

  return socket;
};

export const getSocket = () => socket;

