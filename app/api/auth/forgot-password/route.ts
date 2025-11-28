export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "缺少 email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return NextResponse.json({
      message: "如果此 Email 存在，我們會寄出重設密碼信。",
    });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 小時

  await prisma.user.update({
    where: { email },
    data: {
      resetToken: token,
      resetTokenExpires: expires,
    },
  });

  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await sendMail(
    email,
    "樂齡交友 – 重設密碼",
    `
      <p>您好：</p>
      <p>請點擊以下連結重設您的密碼（1 小時內有效）：</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>若您未請求重設密碼，請忽略此信件。</p>
    `
  );

  return NextResponse.json({
    message: "若 email 存在，我們已寄出重設密碼連結。",
  });
}
