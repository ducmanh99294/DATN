// src/api/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  socket = io("http://localhost:3000", {
    auth: { token }
  });

  return socket;
};

export const getSocket = () => socket;

