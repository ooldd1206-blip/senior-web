// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "缺少 token" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "驗證連結無效或已過期" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  // ✅ 用 req.url 組出絕對網址，導回登入頁並帶上 verified=1
  const redirectUrl = new URL("/auth?verified=1", req.url);
  return NextResponse.redirect(redirectUrl);
}
