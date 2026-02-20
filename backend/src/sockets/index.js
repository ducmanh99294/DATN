const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const chatController = require("../controllers/chatController");

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  });

  // 🔐 AUTH
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.isBanned) {
        return next(new Error("User invalid"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.user._id);

    // =============================
    // 1️⃣ Join personal room
    // =============================
    socket.join(`user_${socket.user._id}`);

    // =============================
    // 2️⃣ AI Chat
    // =============================
    socket.on("send_message", async (message) => {
      try {
        const reply = await chatController.processChatMessage(
          socket.user._id,
          message
        );

        socket.emit("ai_reply", reply);
      } catch {
        socket.emit("ai_reply", "AI đang gặp lỗi.");
      }
    });

    // =============================
    // 3️⃣ User - Doctor Chat
    // =============================
    socket.on("join_chat", (conversationId) => {
      socket.join(`chat_${conversationId}`);
    });

    socket.on("send_chat_message", ({ conversationId, message }) => {
      io.to(`chat_${conversationId}`).emit("receive_chat_message", {
        sender: socket.user._id,
        message
      });
    });

    // =============================
    // 4️⃣ Notifications
    // =============================
    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.user._id);
    });
  });

  // Function gửi thông báo từ backend
  const sendNotification = (userId, data) => {
    io.to(`user_${userId}`).emit("notification", data);
  };

  return { io, sendNotification };
};
