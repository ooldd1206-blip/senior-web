import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";
import { ChatSource } from "@prisma/client";

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
      return new Response(JSON.stringify({ error: "未登入" }), {
        status: 401,
      });
    }

    const me = session.sub;

    const body = await req.json().catch(() => ({}));
    const likedId =
      typeof body?.likedId === "string" ? body.likedId : undefined;

    if (!likedId) {
      return new Response(JSON.stringify({ error: "缺少 likedId" }), {
        status: 400,
      });
    }

    if (likedId === me) {
      return new Response(JSON.stringify({ error: "不能喜歡自己" }), {
        status: 400,
      });
    }

    // 1️⃣ 對方是否已經按過「喜歡我」
    const reverse = await prisma.match.findFirst({
      where: {
        likerId: likedId,
        likedId: me,
      },
    });

    // 2️⃣ 我以前有沒有按過他
    const mine = await prisma.match.findFirst({
      where: {
        likerId: me,
        likedId,
      },
    });

    let match;

    if (mine) {
      // 之前就按過 → 更新 isMutual（有沒有互相喜歡）
      match = await prisma.match.update({
        where: { id: mine.id },
        data: { isMutual: !!reverse },
      });
    } else {
      // 第一次按喜歡 → 建立
      match = await prisma.match.create({
        data: {
          likerId: me,
          likedId,
          isMutual: !!reverse,
        },
      });
    }

    // 3️⃣ 如果對方也喜歡我 → 把對方那筆也標成 isMutual = true
    if (reverse && !reverse.isMutual) {
      await prisma.match.update({
        where: { id: reverse.id },
        data: { isMutual: true },
      });
    }

    // 4️⃣ 如果已經互相喜歡（reverse 存在）→ 確保有一則 MATCH 訊息
    if (reverse) {
      const existingMsg = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: me, receiverId: likedId },
            { senderId: likedId, receiverId: me },
          ],
        },
      });

      if (!existingMsg) {
        await prisma.message.create({
          data: {
            senderId: me,
            receiverId: likedId,
            content: "（開始聊天吧！）",
            read: false,
            source: ChatSource.MATCH,
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

