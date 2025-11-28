"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function NavBarWrapper() {
  const pathname = usePathname();

  // 這些頁面不顯示 Navbar
  const hide = [
    "/",                // 首頁
    "/auth",
    "/auth/login",
    "/auth/register",
    "/login",
    "/register",
    "/onboarding",
  ];

  // ⭐⭐ 重要：如果是 /chat/[id]（例如 /chat/123） → 不顯示 NavBar ⭐⭐
  const isChatRoom = /^\/chat\/[^\/]+$/.test(pathname);

  if (hide.includes(pathname) || isChatRoom) {
    return null;
  }

  return (
    <div className="top-nav-wrapper">
      <div className="top-nav-bg" />
      <NavBar />
    </div>
  );
}
