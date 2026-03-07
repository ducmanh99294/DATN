const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/User");
const chatController = require("../controllers/chatController");

let io;

const getMissingFields = (user) => {
  const missing = [];

  if (!user.fullName) missing.push("Họ và tên");
  if (!user.phone) missing.push("Số điện thoại");

  if (user.role === "patient") {
    if (!user.address) missing.push("Địa chỉ");
    if (!user.dateOfBirth) missing.push("Ngày sinh");
  }

  return missing;
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  });

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error("No cookies"));

    const parsed = cookie.parse(cookies);
    const token = parsed.accessToken;

    if (!token) return next(new Error("No token"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user_${socket.userId}`);

    // validate profile
    socket.on("user_ready", async () => {
      const user = await User.findById(socket.userId);
      const missingFields = getMissingFields(user);

      if (missingFields.length > 0) {
        sendNotification(socket.userId, {
          type: "incomplete_profile",
          message: `Vui lòng cập nhật: ${missingFields.join(", ")}`
        });
      }
    });
    // chat AI
    socket.on("send_message", async (message) => {
      try {
        const reply = await chatController.processChatMessage(
          socket.userId,
          message
        );

        socket.emit("ai_reply", reply);
      } catch {
        socket.emit("ai_reply", "AI đang gặp lỗi.");
      }
    });

    socket.on("join_chat", (conversationId) => {
      socket.join(`chat_${conversationId}`);
    });

    socket.on("send_chat_message", ({ conversationId, message }) => {
      io.to(`chat_${conversationId}`).emit("receive_chat_message", {
        sender: socket.userId,
        message
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.userId);
    });

    
  });
};
 // notify
const sendNotification = (userId, data) => {
  if (!io) {
    console.log("Socket chưa được init");
    return;
  }
  console.log("Emit to:", `user_${userId}`);
  io.to(`user_${userId}`).emit("notification", data);
};

module.exports = {
  initSocket,
  sendNotification
};