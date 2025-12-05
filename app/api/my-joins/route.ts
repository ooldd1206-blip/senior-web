import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

export async function GET(req: Request) {
  const session = await getSession(req).catch(() => null);
  if (!session) {
    return new Response(JSON.stringify({ error: "未登入" }), { status: 401 });
  }

  const userId = session.sub;

  const list = await prisma.activityJoin.findMany({
    where: { userId },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
  });

  return Response.json({ joins: list });
}
