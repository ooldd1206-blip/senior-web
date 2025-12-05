// app/api/chats/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

type ChatSource = "MATCH" | "ACTIVITY_CARD" | "ACTIVITY_TRIP" | null;

type Meta = {
  lastMessage: string;
  lastTime: Date;
  source: ChatSource;
  unreadCount: number;
};

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
  }

  const me = session.sub;

  // ① 先抓所有聊天訊息
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: me }, { receiverId: me }],
    },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, Meta>();

  // ② 依訊息建立基本聊天紀錄
  for (const m of messages) {
    const otherId = m.senderId === me ? m.receiverId : m.senderId;

    const prev = map.get(otherId) ?? {
      lastMessage: "（尚未開始聊天）",
      lastTime: new Date(0),
      source: null,
      unreadCount: 0,
    };

    map.set(otherId, {
      lastMessage: m.content ?? prev.lastMessage,
      lastTime: m.createdAt,
      source: (m.source as ChatSource) ?? prev.source,
      unreadCount:
        prev.unreadCount +
        (m.receiverId === me && !m.read ? 1 : 0),
    });
  }

  // ③ 再補上「互相配對但沒有聊天」的人
  const matches = await prisma.match.findMany({
    where: {
      isMutual: true,
      OR: [{ likerId: me }, { likedId: me }],
    },
    include: {
      liker: { select: { id: true } },
      liked: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const m of matches) {
    const otherId = m.likerId === me ? m.liked.id : m.liker.id;

    // 如果已經因為 message 加過，就跳過
    if (map.has(otherId)) continue;

    // 沒有訊息 → 用 match 的 data 建立聊天室
    map.set(otherId, {
      lastMessage: "（尚未開始聊天）",
      lastTime: m.createdAt,
      source: "MATCH",
      unreadCount: 0,
    });
  }

  // 如果還是空的（沒 match、沒 message）→ 回傳空陣列
  if (map.size === 0) {
    return Response.json({ chats: [] });
  }

  // ④ 把所有聊天室對象的 user 資料抓出來
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

  // ⑤ 組成前端需要的聊天資料格式
  const chats = users
    .map((u) => {
      const meta = map.get(u.id)!;
      return {
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        lastMessage: meta.lastMessage,
        lastTime: meta.lastTime.toISOString(),
        unreadCount: meta.unreadCount,
        source: meta.source,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastTime).getTime() -
        new Date(a.lastTime).getTime()
    );

  return Response.json({ chats });
}
