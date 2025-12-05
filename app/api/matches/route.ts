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
      return new Response(JSON.stringify({ error: "未登入" }), {
        status: 401,
      });
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
            avatarUrl: true,
          },
        },
        liked: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
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
    return new Response(JSON.stringify({ error: "伺服器錯誤" }), {
      status: 500,
    });
  }
}

/**
 * POST /api/matches
 * body: { likedId: string }
 * 按下「喜歡」後建立紀錄；若對方也喜歡我，標記為互相配對
 * ⭐ 如果變成互相喜歡，會自動建立一則 Message（source = MATCH）
 *   讓 /api/chats 可以抓到，聊天室「配對」分頁才會出現對方
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

    // 1️⃣ 看看「對方是否已經按過我」
    const reverse = await prisma.match.findFirst({
      where: {
        likerId: likedId,
        likedId: me,
      },
    });

    // 2️⃣ 我這次的「喜歡」：用 upsert，避免重複按喜歡撞到 @@unique
    const match = await prisma.match.upsert({
      where: {
        likerId_likedId: {
          likerId: me,
          likedId,
        },
      },
      update: {
        isMutual: !!reverse,
      },
      create: {
        likerId: me,
        likedId,
        isMutual: !!reverse,
      },
    });

    // 3️⃣ 只要對方有按過我（不管之前有沒有互惠成功）
    //    → 我們就把兩邊都標成 isMutual = true
    //    → 並且確保有一則 MATCH 來源的訊息（讓聊天室列表有東西）
    if (reverse) {
      if (!reverse.isMutual) {
        await prisma.match.update({
          where: { id: reverse.id },
          data: { isMutual: true },
        });
      }

      // ⭐ 檢查是否已有任一方向的訊息
      const existingMsg = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: me, receiverId: likedId },
            { senderId: likedId, receiverId: me },
          ],
        },
      });

      // ⭐ 沒有訊息 → 建立一則「開始聊天吧！」的系統訊息
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
