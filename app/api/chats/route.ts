// app/api/chats/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
  }

  const me = session.sub;

  // ① 先取得「所有跟我相關的聊天室」
  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        { userA: me },
        { userB: me }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  // ✨ 若沒有聊天室，直接回空陣列（代表還沒有配對成功）
  if (chats.length === 0) {
    return Response.json({ chats: [] });
  }

  // ② 用來存每個聊天室合併後的資訊
  const results: any[] = [];

  for (const c of chats) {
    const otherId = c.userA === me ? c.userB : c.userA;

    // 找最新訊息（如果有）
    const lastMsg = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: me, receiverId: otherId },
          { senderId: otherId, receiverId: me }
        ],
      },
      orderBy: { createdAt: "desc" }
    });

    // 查對方資料
    const other = await prisma.user.findUnique({
      where: { id: otherId },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true
      }
    });

    results.push({
      id: other?.id,
      displayName: other?.displayName,
      email: other?.email,
      avatarUrl: other?.avatarUrl,

      // 來源（MATCH / ACTIVITY…）
      source: c.source,

      // 如果有聊天紀錄 → 用紀錄  
      // 如果沒有聊天 → 顯示尚未開始聊天
      lastMessage: lastMsg?.content ?? "（尚未開始聊天）",
      lastTime: (lastMsg?.createdAt ?? c.createdAt).toISOString(),

      // 計算未讀訊息數
      unreadCount: await prisma.message.count({
        where: {
          receiverId: me,
          senderId: otherId,
          read: false
        }
      })
    });
  }

  // ③ 最後依照時間排序（新 → 舊）
  results.sort(
    (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
  );

  return Response.json({ chats: results });
}
