// socket-server.cjs
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// ⭐ 修正：加上 CORS，允許你的前端網址
const io = new Server(server, {
  cors: {
    origin: [
      "https://seniorweb-five.vercel.app", // 你的 Vercel 前端
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"], // ⭐ 加上 fallback，Render 需要這個
  path: "/socket.io",                   // ⭐ 必加，否則 Render proxy 會截斷 upgrade request
});

// ---------------------------
// 🔵 Socket 溝通邏輯
// ---------------------------

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  socket.on("register-user", ({ userId }) => {
    console.log("User registered:", userId);
    socket.join(userId);
  });

  socket.on("join-chat", ({ me, other }) => {
    console.log(`📌 ${me} joined chat with ${other}`);
    socket.join(me);
    socket.join(other);
  });

  socket.on("send-message", (payload) => {
    const { senderId, receiverId } = payload;

    console.log("📨 Message from", senderId, "to", receiverId);

    // 發給個人房間（receiver）
    io.to(receiverId).emit("new-message", payload);

    // 通知 receiver 更新列表
    io.to(receiverId).emit("notify-message", {
      from: senderId,
      content: payload.content ?? "",
      createdAt: payload.createdAt,
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ---------------------------
// 🚀 Render 會使用這個 PORT
// ---------------------------

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("🚀 Socket server running on port", PORT);
});
