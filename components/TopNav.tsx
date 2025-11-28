"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Session = { displayName: string | null };

export default function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session>({ displayName: null });

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setSession({ displayName: d.user?.displayName ?? null }))
      .catch(() => setSession({ displayName: null }));
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setSession({ displayName: null });
    window.location.href = "/";
  }

  function isActive(href: string) {
    return pathname === href;
  }

  return (
    <>
      {/* Skip link（鍵盤/報讀友善） */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-amber-200 rounded-xl px-4 py-2 text-lg"
      >
        跳到主內容
      </a>

      <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="px-4 py-3 flex items-center justify-between whitespace-nowrap">
          <Link
            href="/"
            className="text-2xl md:text-3xl font-extrabold text-neutral-900"
          >
            樂齡交友
          </Link>

          {/* 桌面版導覽 */}
          <div className="hidden md:flex items-center gap-3 whitespace-nowrap text-neutral-900">
            <NavLink href="/discovery" active={isActive("/discovery")}>
              配對
            </NavLink>
            <NavLink href="/activities" active={isActive("/activities")}>
              活動
            </NavLink>
            <NavLink href="/matches" active={isActive("/matches")}>
              配對清單
            </NavLink>
            <NavLink href="/chat" active={isActive("/chat")}>
              聊天室
            </NavLink>
            <NavLink href="/profile" active={isActive("/profile")}>
              我的資料
            </NavLink>


            {session.displayName ? (
              <>
                <span
                  aria-live="polite"
                  className="text-xl text-neutral-900 mr-1"
                >
                  歡迎，{session.displayName}
                </span>
                <button
                  onClick={logout}
                  className="text-xl text-neutral-900 bg-gray-200 hover:bg-gray-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-gray-500 rounded-2xl px-4 py-2"
                >
                  登出
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-xl text-neutral-900 bg-blue-300 hover:bg-blue-400 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-700 rounded-2xl px-4 py-2"
              >
                登入
              </Link>
            )}
          </div>

          {/* 手機版菜單按鈕（大觸控區） */}
          <button
            aria-label="打開或關閉選單"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-2xl px-4 py-3 bg-neutral-100 border border-neutral-300 text-neutral-900"
          >
            {open ? "關閉" : "選單"}
          </button>
        </div>

        {/* 手機版下拉選單 */}
        {open && (
          <div className="md:hidden border-t border-neutral-200 px-4 py-3 space-y-3 text-neutral-900">
            <MobileLink
              href="/discovery"
              active={isActive("/discovery")}
              onClick={() => setOpen(false)}
            >
              配對
            </MobileLink>
            <MobileLink
              href="/activities"
              active={isActive("/activities")}
              onClick={() => setOpen(false)}
            >
              活動
            </MobileLink>
            <MobileLink
              href="/matches"
              active={isActive("/matches")}
              onClick={() => setOpen(false)}
            >
              配對清單
            </MobileLink>
            <MobileLink
              href="/chat"
              active={isActive("/chat")}
              onClick={() => setOpen(false)}
            >
              聊天室
            </MobileLink>
            <MobileLink
              href="/profile"
              active={isActive("/profile")}
              onClick={() => setOpen(false)}
            >
              我的資料
            </MobileLink>

            {session.displayName ? (
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full text-left text-2xl text-neutral-900 bg-gray-200 hover:bg-gray-300 rounded-2xl px-4 py-3"
              >
                登出（{session.displayName}）
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="block text-2xl text-neutral-900 bg-blue-300 hover:bg-blue-400 rounded-2xl px-4 py-3"
              >
                登入
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-xl rounded-2xl px-4 py-2 focus-visible:outline focus-visible:outline-4 ${
        active
          ? "bg-amber-200 outline-amber-500 text-neutral-900"
          : "bg-neutral-100 hover:bg-neutral-200 outline-neutral-500 text-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`block text-2xl rounded-2xl px-4 py-3 text-neutral-900 ${
        active ? "bg-amber-200" : "bg-neutral-100 hover:bg-neutral-200"
      }`}
    >
      {children}
    </Link>
  );
}
