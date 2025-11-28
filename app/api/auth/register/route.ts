import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "此 Email 已被註冊" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = generateToken(24);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        emailVerifiedAt: null,
        verificationToken,
        verificationTokenExpires: expires,
      },
    });

    const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${verificationToken}`;

    await sendMail(
      email,
      "樂齡交友 – 請驗證您的 Email",
      `
      <p>${displayName} 您好，</p>
      <p>請點擊以下連結完成信箱驗證：</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>若您沒有註冊，請忽略此信。</p>
      `
    );

    return NextResponse.json({
      ok: true,
      message: "註冊成功，請到信箱收信完成驗證",
    });
  } catch (err) {
    console.error("POST /api/auth/register error", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
