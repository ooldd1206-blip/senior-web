// app/api/users/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return new Response("未登入", { status: 401 });

  const me = session.sub;

  // 只查「我按過誰」
  const likedByMe = await prisma.match.findMany({
    where: {
      likerId: me,          // ✅ 只有我按別人的
    },
    select: {
      likedId: true,
    },
  });

  // 要排除的 id：我自己 + 我已經按過的人
  const blockedIds = new Set<string>();
  blockedIds.add(me);
  for (const m of likedByMe) {
    blockedIds.add(m.likedId);
  }

  // 撈出我還沒按過的其他使用者
  const users = await prisma.user.findMany({
    where: {
      id: {
        notIn: Array.from(blockedIds),
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      email: true,
      displayName: true,
      gender: true,
      ageGroup: true,
      city: true,
      interests: true,
      bio: true,
      avatarUrl: true,
      galleryUrls: true,
    },
  });

  return Response.json({ users });
}
