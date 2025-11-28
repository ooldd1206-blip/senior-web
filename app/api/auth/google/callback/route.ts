import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/cookies";
import { NextResponse } from "next/server";

const client_id = process.env.GOOGLE_CLIENT_ID!;
const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI!;
const APP_URL = process.env.APP_URL!;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(APP_URL);
    }

    // 1️⃣ 換 token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    const access_token = tokenData.access_token;

    // 2️⃣ 拿 Google 使用者資料
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = await userRes.json();
    const email = profile.email;
    const name = profile.name;

    // 3️⃣ 查 DB
    let user = await prisma.user.findUnique({ where: { email } });

    const firstLogin = !user;

    // 4️⃣ 沒有 → 自動註冊
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          displayName: name || email.split("@")[0],
          passwordHash: "",
          emailVerifiedAt: new Date(),
        },
      });
    }

    // 5️⃣ Session
    await setSessionCookie({
      sub: user.id,
      email: user.email,
      displayName: user.displayName ?? "",
    });

    // 6️⃣ 第一次登入 → onboarding
    if (firstLogin) {
      return NextResponse.redirect(`${APP_URL}/onboarding`);
    }

    // ✔ 已登入過 → home
    return NextResponse.redirect(`${APP_URL}/home`);

  } catch (err) {
    console.error("Google callback error:", err);
    return new NextResponse("Google Login Error", { status: 500 });
  }
}
