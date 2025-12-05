// socket-server.js
const http = require("http");
const { Server } = require("socket.io");

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

// 做一個兩人固定的 room id，順序不影響
function roomIdFor(a, b) {
  return [a, b].sort().join("_");
}

io.on("connection", (socket) => {
  console.log("✅ a user connected:", socket.id);

  // ✅ 聊天室列表用的：讓前端告訴我「我是誰」
  // 之後就可以只通知這個人，不用 io.emit 全部亂發
  socket.on("register-user", ({ userId }) => {
    if (!userId) return;
    // 每個使用者都有一間自己的房 "user-xxx"
    socket.join(`user-${userId}`);
    console.log(`🟦 user ${userId} registered for list updates`);
  });

  // 加入兩人聊天室
  socket.on("join-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);
    socket.join(room);
    console.log(`📦 ${socket.id} joined room ${room}`);
  });

  // 有人送訊息
  socket.on("send-message", (payload) => {
    const { from, to, content } = payload;
    const room = roomIdFor(from, to);

    const msg = {
      from,
      to,
      content,
      createdAt: new Date().toISOString(),
    };

    // 1) 傳給這個房間的其他人（正在聊天的頁面）
    socket.to(room).emit("new-message", msg);

    // 2) ✅ 再「只通知被傳訊息的人」的聊天列表，讓他亮藍點、更新最後訊息
    //    因為對方在 /chat 頁會先 register-user，所以這裡可精準推播
    io.to(`user-${to}`).emit("notify-message", msg);

    // 3) 也可以通知送訊息的這一方的列表（讓最後一則訊息立即更新）
    io.to(`user-${from}`).emit("notify-message", msg);
  });

  // 有人打開/離開聊天室 → 告訴其他人這個對話已讀了
  socket.on("read-chat", ({ me, other }) => {
    const room = roomIdFor(me, other);

    // 傳給同一聊天室的人
    io.to(room).emit("chat-read", {
      reader: me,
      other,
    });

    // ✅ 可以同時清掉列表上的未讀（收訊息的人打開聊天室）
    io.to(`user-${other}`).emit("chat-read", {
      reader: me,
      other,
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ user disconnected:", socket.id);
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log("🚀 Socket server listening on http://localhost:" + PORT);
});
