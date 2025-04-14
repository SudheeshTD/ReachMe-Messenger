import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://localhost:5173", // Add HTTPS for local development
    ],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

//Used to store Online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A User Connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() used to brodcase events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user Disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
