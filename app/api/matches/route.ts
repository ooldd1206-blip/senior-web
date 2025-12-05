import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

/**
 * GET /api/matches
 * 回傳目前登入者的「互相配對清單」
 */
export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
    }

    const me = session.sub;

    const rows = await prisma.match.findMany({
      where: {
        isMutual: true,
        OR: [{ likerId: me }, { likedId: me }],
      },
      include: {
        liker: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,     // 👈 加這裡
          },
        },
        liked: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,     // 👈 加這裡
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 以「對方 id」去重；若重複，保留最早成為互相配對的時間
    const unique = new Map<
      string,
      {
        id: string;
        displayName: string;
        email: string;
        avatarUrl: string | null;
        since: Date;
      }
    >();

    for (const m of rows) {
      const other = m.likerId === me ? m.liked : m.liker;
      const since = m.createdAt;
      const prev = unique.get(other.id);
      if (!prev || since < (prev.since as any)) {
        unique.set(other.id, {
          id: other.id,
          displayName: other.displayName,
          email: other.email,
          avatarUrl: other.avatarUrl ?? null,
          since,
        });
      }
    }

    return Response.json({ matches: Array.from(unique.values()) });
  } catch (err: any) {
    console.error("GET /api/matches error:", err);
    return new Response(JSON.stringify({ error: "伺服器錯誤" }), { status: 500 });
  }
}

/**
 * POST /api/matches
 * body: { likedId: string }
 * 按下「喜歡」後建立紀錄；若對方也喜歡我，標記為互相配對
 */
export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const likedId = typeof body?.likedId === "string" ? body.likedId : undefined;

    if (!likedId) {
      return new Response(JSON.stringify({ error: "缺少 likedId" }), {
        status: 400,
      });
    }
// 找「對方喜歡我」→ 判斷是否互相喜歡
const reverse = await prisma.match.findFirst({
  where: {
    likerId: likedId,
    likedId: session.sub,
  },
});

// 建立「我喜歡對方」的紀錄
const match = await prisma.match.create({
  data: {
    likerId: session.sub,
    likedId,
    isMutual: !!reverse,
  },
});

// 如果對方也有按我 → 成功互相喜歡 → 建立聊天室
if (reverse) {
  await prisma.match.update({
    where: { id: reverse.id },
    data: { isMutual: true },
  });

  // 檢查是否已有聊天室
  const existingChat = await prisma.chat.findFirst({
    where: {
      OR: [
        { userA: session.sub, userB: likedId },
        { userA: likedId, userB: session.sub },
      ],
    },
  });

  // 沒有聊天室 → 建立新的
  if (!existingChat) {
    await prisma.chat.create({
      data: {
        userA: session.sub,
        userB: likedId,
        source: "MATCH",
      },
    });
  }
}



    return Response.json({ match });
  } catch (err: any) {
    console.error("POST /api/matches error:", err);
    return new Response(JSON.stringify({ error: "伺服器錯誤" }), {
      status: 500,
    });
  }
}
