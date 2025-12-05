// socket-server.js
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);

// ⭐ Render 會提供 PORT（例如 10000），不能寫死 4000
const PORT = process.env.PORT || 4000;

// ⭐ 必須加入你的 Vercel 網域才能從 Vercel 連線
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://seniorweb-five.vercel.app", // 你的 Vercel 網域（務必填正確）
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST"],
  },
});

// 兩人固定房間
function roomIdFor(a, b) {
  return [a, b].sort().join("_");
}

io.on("connection", (socket) => {
  console.log("✅ a user connected:", socket.id);

  // 前端告訴我這個 socket 是哪位使用者
  socket.on("register-user", ({ userId }) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    console.log(`🟦 user ${userId} registered`);
  });

  // 加入聊天室
  socket.on("join-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);
    socket.join(room);
    console.log(`📦 ${socket.id} joined room ${room}`);
  });

  // 送訊息
  socket.on("send-message", (payload) => {
    const { from, to, content } = payload;
    const room = roomIdFor(from, to);

    const msg = {
      from,
      to,
      content,
      createdAt: new Date().toISOString(),
    };

    // 聊天室內其他人收到
    socket.to(room).emit("new-message", msg);

    // 聊天列表更新（對方 & 自己）
    io.to(`user-${to}`).emit("notify-message", msg);
    io.to(`user-${from}`).emit("notify-message", msg);
  });

  // 已讀
  socket.on("read-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);

    io.to(room).emit("chat-read", { reader: me, other });
    io.to(`user-${other}`).emit("chat-read", { reader: me, other });
  });

  socket.on("disconnect", () => {
    console.log("❌ user disconnected:", socket.id);
  });
});

// ⭐⭐ 最重要的：Render 必須 listen(PORT)
httpServer.listen(PORT, () => {
  console.log("🚀 Socket server listening on port " + PORT);
});
