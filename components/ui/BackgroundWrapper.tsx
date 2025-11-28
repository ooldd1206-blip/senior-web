"use client";

import { usePathname } from "next/navigation";

export default function BackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ❗ 不需要背景（不套紙張背景）的頁面
  const noBg = [
    "/",
    "/auth",
    "/login",
    "/register",
    "/onboarding",
  ];

  // ⭐ 所有聊天頁（/chat 與 /chat/[id]）都不能套 paper-bg
  const isChatPage = pathname.startsWith("/chat");

  const usePaperBg = !noBg.includes(pathname) && !isChatPage;

  return (
    <div className={usePaperBg ? "paper-bg" : ""}>
      {children}
    </div>
  );
}
