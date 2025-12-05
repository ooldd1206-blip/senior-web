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

    // 1️⃣ 交換 Access Token
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

    if (!tokenData.access_token) {
      console.error("Google Token Error:", tokenData);
      return new NextResponse("Google Login Error", { status: 500 });
    }

    const access_token = tokenData.access_token;

    // 2️⃣ 取得 Google 使用者資料 (v3)
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = await userRes.json();

    const email = profile.email;
    const name = profile.name;

    // 沒有 email 則拒絕（Google 有些帳號沒公開 email）
    if (!email) {
      console.error("Google profile 沒有 email:", profile);
      return new NextResponse("Google Login Error: No email", { status: 400 });
    }

    // 3️⃣ 查詢 DB
    let user = await prisma.user.findUnique({ where: { email } });

    const firstLogin = !user;

    // 4️⃣ 若無帳號 → 自動註冊
    if (!user) {
      const safeName = name || email.split("@")[0];

      user = await prisma.user.create({
        data: {
          email,
          displayName: safeName,
          passwordHash: "",
          emailVerifiedAt: new Date(),
        },
      });
    }

    // 5️⃣ 設定 Session Cookie
    await setSessionCookie({
      sub: user.id,
      email: user.email,
      displayName: user.displayName ?? "",
    });

    // 6️⃣ 導向
    if (firstLogin) {
      return NextResponse.redirect(`${APP_URL}/onboarding`);
    }

    return NextResponse.redirect(`${APP_URL}/home`);

  } catch (err) {
    console.error("Google callback error:", err);
    return new NextResponse("Google Login Error", { status: 500 });
  }
}
