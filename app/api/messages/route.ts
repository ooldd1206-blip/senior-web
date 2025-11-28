// app/api/messages/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

// 取得聊天紀錄
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return new Response("未登入", { status: 401 });

  const { searchParams } = new URL(req.url);
  const otherId = searchParams.get("user");
  if (!otherId) return new Response("缺少 user 參數", { status: 400 });

  // 把對方的頭貼也一起查出來
  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: {
      id: true,
      displayName: true,
      email: true,
      avatarUrl: true,
    },
  });

  // 查出雙方對話
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.sub, receiverId: otherId },
        { senderId: otherId, receiverId: session.sub },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  // 把「別人發給我、還沒讀的」設成已讀
  await prisma.message.updateMany({
    where: {
      receiverId: session.sub,
      senderId: otherId,
      read: false,
    },
    data: { read: true },
  });

  // 🆕 從最後一筆有寫 source 的訊息，當作這段對話的來源
  const latestWithSource = [...messages]
    .reverse()
    .find((m) => m.source !== null);

  const source = latestWithSource?.source ?? null;

  return Response.json({
    messages,
    other,
    me: session.sub,
    source, // 🆕 給 /chat 列表判斷用
  });
}

// 發送訊息
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) return new Response("未登入", { status: 401 });

  const body = await req.json();
  const { receiverId, content, source } = body;

  if (!receiverId || !content?.trim()) {
    return new Response("缺少必要欄位", { status: 400 });
  }

  // 🆕 把前端傳來的來源字串，轉成 enum
  let chatSource:
    | "MATCH"
    | "ACTIVITY_CARD"
    | "ACTIVITY_TRIP"
    | undefined;

  if (source === "MATCH") chatSource = "MATCH";
  if (source === "ACTIVITY_CARD") chatSource = "ACTIVITY_CARD";
  if (source === "ACTIVITY_TRIP") chatSource = "ACTIVITY_TRIP";

  const msg = await prisma.message.create({
    data: {
      senderId: session.sub,
      receiverId,
      content: content.trim(),
      read: false, // 新訊息預設未讀
      source: chatSource, // 🆕 可為 undefined（就會存 null）
    },
  });

  return Response.json({ message: msg });
}
