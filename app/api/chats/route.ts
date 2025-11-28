// app/api/chats/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
  }

  const me = session.sub;

  // 把所有「跟我有關的訊息」抓出來
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: me }, { receiverId: me }],
    },
    orderBy: { createdAt: "asc" }, // 由舊到新，最後一筆就是最新
  });

  if (messages.length === 0) {
    return Response.json({ chats: [] });
  }

  // 每個對象的「最後一則訊息」 & 「未讀數」
  type Meta = {
    lastMessage: string;
    lastTime: Date;
    source: string | null;
    unreadCount: number;
  };

  const map = new Map<string, Meta>();

  for (const m of messages) {
    const otherId = m.senderId === me ? m.receiverId : m.senderId;

    const prev = map.get(otherId) ?? {
      lastMessage: "",
      lastTime: new Date(0),
      source: null,
      unreadCount: 0,
    };

    // 最新訊息覆蓋
    map.set(otherId, {
      lastMessage: m.content,
      lastTime: m.createdAt,
      source: m.source ?? prev.source, // 優先用較新的，有就保留
      unreadCount:
        prev.unreadCount +
        (m.receiverId === me && !m.read ? 1 : 0),
    });
  }

  const userIds = Array.from(map.keys());

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      displayName: true,
      email: true,
      avatarUrl: true,
    },
  });

  const chats = users
    .map((u) => {
      const meta = map.get(u.id)!;
      return {
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        lastMessage: meta.lastMessage,
        lastTime: meta.lastTime,
        unreadCount: meta.unreadCount,
        source: meta.source, // "MATCH" | "ACTIVITY_CARD" | "ACTIVITY_TRIP" | null
      };
    })
    // 依照最後聊天時間排序（新 → 舊）
    .sort(
      (a, b) =>
        new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );

  return Response.json({ chats });
}
