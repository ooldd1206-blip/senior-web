// app/api/activities/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const session = await getSession(req).catch(() => null);
  const userId = session?.sub ?? null;

  // 🔹 單筆詳情（不動）
  if (id) {
    const act = await prisma.activity.findUnique({
      where: { id },
      include: {
        participants: true,
        creator: { select: { id: true, displayName: true } },
      },
    });

    if (!act) return new Response("Not found", { status: 404 });

    const joined =
      !!userId && act.participants.some((p) => p.userId === userId);

    return Response.json({
      activity: {
        id: act.id,
        title: act.title,
        description: act.description,
        date: act.date,
        location: act.location,
        capacity: act.capacity,
        category: act.category,
        joined,
        joinedCount: act.participants.length,
        creatorId: act.creatorId,
        creatorName: act.creator.displayName ?? "",
        creatorPhone: act.contactPhone ?? "",
      },
    });
  }

  // 🔹 活動列表（要回傳正確 creator、participants）
  const list = await prisma.activity.findMany({
    orderBy: { date: "asc" },
    include: {
      creator: { select: { displayName: true } },
      participants: true, // ⭐ 必須加入這個
      _count: { select: { participants: true } },
    },
  });

  const activities = list.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date,
    category: a.category,
    joined:
      !!userId && a.participants.some((p) => p.userId === userId),
    joinedCount: a._count.participants,
    participants: a.participants, // ⭐ 回傳全部參加者，前端才會 length 正確
    creator: { displayName: a.creator?.displayName ?? "使用者" },
  }));

  return Response.json({ activities });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const {
    title,
    description,
    date,
    location,
    capacity,
    category,
    contactPhone,
  } = body;

  if (!title?.trim() || !date || !location?.trim() || !category || !contactPhone?.trim()) {
    return new Response(
      JSON.stringify({
        error: "請把「活動名稱 / 日期時間 / 地點 / 類型 / 聯絡電話」填寫完整",
      }),
      { status: 400 }
    );
  }

  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) {
    return new Response(JSON.stringify({ error: "日期時間格式不正確" }), {
      status: 400,
    });
  }

  let cap: number | null = null;
  if (typeof capacity === "number") cap = capacity;
  else if (typeof capacity === "string" && capacity.trim() !== "") {
    const num = Number(capacity);
    if (!Number.isNaN(num) && num > 0) cap = num;
  }

  const act = await prisma.activity.create({
    data: {
      title: title.trim(),
      description: description?.toString().trim() || null,
      date: dt,
      location: location.trim(),
      category: category.toString().trim(),
      capacity: cap,
      creatorId: session.sub,
      contactPhone: contactPhone.trim(),
    },
  });

  return Response.json({ activity: act });
}
