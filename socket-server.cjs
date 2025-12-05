// socket-server.js
const http = require("http");
const { Server } = require("socket.io");

// ---------------------------
// ✅ 在雲端運作時會自動使用 Render / Railway 給的 PORT
//    本地測試時預設為 4000
// ---------------------------
const PORT = process.env.PORT || 4000;

// 建立 HTTP Server（Render / Railway 會自動加上 HTTPS）
const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["https://seniorweb-five.vercel.app"], // 允許你的前端
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ---------------------------
// 🔧 固定兩人聊天室 roomId
// ---------------------------
function roomIdFor(a, b) {
  return [a, b].sort().join("_");
}

// ---------------------------
// 🌐 Socket 事件
// ---------------------------
io.on("connection", (socket) => {
  console.log("✅ a user connected:", socket.id);

  // 使用者登入聊天室清單
  socket.on("register-user", ({ userId }) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    console.log(`🟦 user ${userId} registered for list updates`);
  });

  // 加入兩人聊天室
  socket.on("join-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);
    socket.join(room);
    console.log(`📦 ${socket.id} joined room ${room}`);
  });

  // 處理訊息
  socket.on("send-message", (payload) => {
    const { from, to, content } = payload;
    const room = roomIdFor(from, to);

    const msg = {
      from,
      to,
      content,
      createdAt: new Date().toISOString(),
    };

    // 傳給聊天室內的另一人（正在聊天）
    socket.to(room).emit("new-message", msg);

    // 通知對方：聊天列表更新（未讀 + 最後訊息）
    io.to(`user-${to}`).emit("notify-message", msg);

    // 通知自己：更新列表
    io.to(`user-${from}`).emit("notify-message", msg);
  });

  // 已讀訊息
  socket.on("read-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);

    io.to(room).emit("chat-read", { reader: me, other });
    io.to(`user-${other}`).emit("chat-read", { reader: me, other });
  });

  socket.on("disconnect", () => {
    console.log("❌ user disconnected:", socket.id);
  });
});

// ---------------------------
// 🚀 啟動（自動支援 HTTPS，取決於雲端平台）
// ---------------------------
httpServer.listen(PORT, () => {
  console.log("🚀 Socket server running on port:", PORT);
});
