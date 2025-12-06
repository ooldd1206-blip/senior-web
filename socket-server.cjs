// socket-server.js
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);

// ⭐ Render 的 PORT
const PORT = process.env.PORT || 4000;

// ⭐ 開放 Render 健康檢查
app.get("/", (req, res) => {
  res.send("Socket server is running");
});

// ⭐ CORS（務必加上你的 Render URL）
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://seniorweb-five.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-socket-server.onrender.com", // <<<< 你自己的 Render URL
    ],
    methods: ["GET", "POST"],
  },
});

// 房間 ID
function roomIdFor(a, b) {
  return [a, b].sort().join("_");
}

io.on("connection", (socket) => {
  console.log("✅ a user connected:", socket.id);

  socket.on("register-user", ({ userId }) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    console.log(`🟦 user ${userId} registered`);
  });

  socket.on("join-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);
    socket.join(room);
    console.log(`📦 ${socket.id} joined room ${room}`);
  });

  // ✨ send-message 修正（讓自己也收到）
  socket.on("send-message", (payload) => {
    const from = payload.from || payload.senderId;
    const to = payload.to || payload.receiverId;

    const msg = {
      from,
      to,
      content: payload.content,
      imageUrl: payload.imageUrl,
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    const room = roomIdFor(from, to);

    console.log("📨 send-message:", msg);

    // ⭐ 修正：讓自己也收到
    io.to(room).emit("new-message", msg);

    // 更新列表
    io.to(`user-${to}`).emit("notify-message", msg);
    io.to(`user-${from}`).emit("notify-message", msg);
  });

  socket.on("read-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);

    io.to(room).emit("chat-read", { reader: me, other });
    io.to(`user-${other}`).emit("chat-read", { reader: me, other });
  });

  socket.on("disconnect", () => {
    console.log("❌ user disconnected:", socket.id);
  });
});

// ⭐ Render 確保 listen(PORT)
httpServer.listen(PORT, () => {
  console.log("🚀 Socket server listening on port " + PORT);
});
