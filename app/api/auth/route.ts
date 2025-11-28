/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/auth/route.ts
export const runtime = "nodejs";


import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { setSessionCookie } from "@/lib/cookies";
import crypto from "crypto";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  const { action, email, password, displayName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }

  // 密碼規則：至少 8 碼、同時包含英文與數字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  // 🔐 註冊
  if (action === "register") {
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: "密碼至少 8 碼，且需包含英文字母與數字" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "信箱已註冊" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || "使用者",
        emailVerifiedAt: null,
        verificationToken: token,
        verificationTokenExpires: expires,
      },
    });

    const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

    await sendMail(
      email,
      "樂齡交友 – 請驗證您的 Email",
      `
        <p>${displayName || "使用者"} 您好，</p>
        <p>請點擊以下連結完成您的信箱驗證：</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>若您未註冊此帳號，請忽略此信件。</p>
      `
    );

    return NextResponse.json({
      message: "註冊成功！請前往信箱完成驗證。",
      emailSent: true,
    });
  }

  // 🔓 登入
  if (action === "login") {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return NextResponse.json({ error: "帳號不存在" }, { status: 401 });
    if (!user.emailVerifiedAt)
      return NextResponse.json(
        { error: "請先到 Email 完成驗證" },
        { status: 403 }
      );
if (!user.passwordHash) {
  return NextResponse.json({ error: "此帳號未使用密碼登入（Google 登入用戶）" }, { status: 400 });
}

const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });

    await setSessionCookie({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    return NextResponse.json({
      message: "登入成功",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
