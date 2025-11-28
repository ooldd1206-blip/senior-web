// app/api/join/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
  }

  // join: true 表示要報名；false 表示取消報名
  const { activityId, join } = await req
    .json()
    .catch(() => ({ activityId: null, join: null }));

  if (!activityId || typeof join !== "boolean") {
    return new Response(
      JSON.stringify({ error: "缺少 activityId 或 join 參數不正確" }),
      { status: 400 }
    );
  }

  const userId = session.sub;

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { participants: { select: { userId: true } } },
  });
  if (!activity) {
    return new Response(JSON.stringify({ error: "找不到活動" }), {
      status: 404,
    });
  }

  const alreadyJoined = activity.participants.some((p) => p.userId === userId);

  if (join && !alreadyJoined) {
    await prisma.activityJoin.create({ data: { userId, activityId } });
  } else if (!join && alreadyJoined) {
    await prisma.activityJoin.deleteMany({ where: { userId, activityId } });
  }

  const updatedCount = await prisma.activityJoin.count({
    where: { activityId },
  });

  return Response.json({
    message: join ? "報名成功" : "取消報名",
    joinedCount: updatedCount,
    joined: join,
  });
}
