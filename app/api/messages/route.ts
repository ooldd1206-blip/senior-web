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

  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: {
      id: true,
      displayName: true,
      email: true,
      avatarUrl: true,
    },
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.sub, receiverId: otherId },
        { senderId: otherId, receiverId: session.sub },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: {
      receiverId: session.sub,
      senderId: otherId,
      read: false,
    },
    data: { read: true },
  });

  const latestWithSource = [...messages]
    .reverse()
    .find((m) => m.source !== null);

  const source = latestWithSource?.source ?? null;

  return Response.json({
    messages,
    other,
    me: session.sub,
    source,
  });
}

// 發送訊息
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) return new Response("未登入", { status: 401 });

  const body = await req.json();
  const { receiverId, content, imageUrl, audioUrl, source } = body;

  if (!receiverId) {
    return new Response("缺少必要欄位 receiverId", { status: 400 });
  }

  if (!content?.trim() && !imageUrl && !audioUrl) {
    return new Response("缺少訊息內容", { status: 400 });
  }

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
      content: content?.trim() || "", // 圖片訊息可以是空字串
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      read: false,
      source: chatSource,
    },
  });

  return Response.json({ message: msg });
}
