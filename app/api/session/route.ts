import { getSession } from "@/lib/cookies";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const sess = await getSession(req);


  // 如果沒登入
  if (!sess) {
    return Response.json({ user: null });
  }

  // 從資料庫查出使用者詳細資訊
  const user = await prisma.user.findUnique({
    where: { id: sess.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
  });

  return Response.json({ user });
}
