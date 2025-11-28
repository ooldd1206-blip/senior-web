// app/api/profile/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/cookies";

// 取得自己的資料
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return new Response("未登入", { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.sub },
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
      onboardingCompleted: true,
    },
  });

  return Response.json({ user: me });
}

// 🟢 修正：POST 必須傳入 req 才能讀 cookie
export async function POST(req: Request) {
  const session = await getSession(req);   // <-- ⭐ 必加 req
  if (!session) {
    return new Response(JSON.stringify({ error: "未登入" }), {
      status: 401,
    });
  }

  const userId = session.sub;
  const body = await req.json();

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: body.displayName,
      gender: body.gender,
      city: body.city,
      ageGroup: body.ageGroup,
      interests: body.interests,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      galleryUrls: body.galleryUrls,
      onboardingCompleted: true,
    },
  });

  return new Response(JSON.stringify({ ok: true, user: updated }));
}
