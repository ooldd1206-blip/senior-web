import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) return NextResponse.redirect("/?error=no_code");

  // 1️⃣ 換 access_token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v12.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.FB_CLIENT_ID!,
        client_secret: process.env.FB_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/facebook/callback`,
        code,
      })
  );

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect("/?error=token_fail");
  }

  // 2️⃣ 取得使用者資料
  const profileRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
  );

  const user = await profileRes.json();
  console.log("FB user:", user);

  // 3️⃣ TODO：在這裡和資料庫互動 (登入 / 註冊)
  // 你 Google OAuth 用的方式一樣可複製過來。

  return NextResponse.redirect("/");
}
