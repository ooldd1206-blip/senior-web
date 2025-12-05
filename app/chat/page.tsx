"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type ChatPreview = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  lastMessage?: string;
  lastTime?: string;
  unreadCount?: number;
  source?: "MATCH" | "ACTIVITY_CARD" | "ACTIVITY_TRIP" | null;
  tagText?: string;
};

let socket: Socket | null = null;

function formatTime(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const y = new Date();
  y.setDate(now.getDate() - 1);

  const isYesterday =
    d.getFullYear() === y.getFullYear() &&
    d.getMonth() === y.getMonth() &&
    d.getDate() === y.getDate();

  if (isToday) {
    return d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
  }

  if (isYesterday) return "昨天";

  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ChatListPage() {
  const [me, setMe] = useState<string>("");
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [msg, setMsg] = useState("");
  const [currentTab, setCurrentTab] = useState<"MATCH" | "ACTIVITY">("MATCH");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.id) setMe(d.user.id);
      });
  }, []);

  function sourceToTag(source?: string | null): string {
    if (source === "ACTIVITY_CARD") return "牌咖";
    if (source === "ACTIVITY_TRIP") return "玩伴旅伴";
    return "交友配對";
  }

  async function loadChats() {
    try {
      const res = await fetch("/api/chats");
      if (res.status === 401) {
        setMsg("請先登入");
        return;
      }
      const data = await res.json();
      const list = (data.chats || []) as any[];

      const mapped: ChatPreview[] = list.map((c) => {
        const src =
          (c.source as "MATCH" | "ACTIVITY_CARD" | "ACTIVITY_TRIP" | null) ??
          null;
        return {
          id: c.id,
          displayName: c.displayName,
          email: c.email,
          avatarUrl: c.avatarUrl ?? null,
          lastMessage: c.lastMessage ?? "（尚未開始聊天）",
          lastTime:
            typeof c.lastTime === "string"
              ? c.lastTime
              : c.lastTime
              ? new Date(c.lastTime).toISOString()
              : "",
          unreadCount: c.unreadCount ?? 0,
          source: src,
          tagText: sourceToTag(src),
        };
      });

      setChats(mapped);
    } catch {
      setMsg("讀取聊天室清單失敗");
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (!me) return;

    if (!socket) socket = io("http://localhost:4000");

    socket.emit("register-user", { userId: me });

    socket.on("notify-message", ({ from, content, createdAt }) => {
      setChats((prev) => {
        const exist = prev.find((c) => c.id === from);

        if (exist) {
          const updated = prev
            .map((c) =>
              c.id === from
                ? {
                    ...c,
                    lastMessage: content,
                    lastTime: createdAt,
                    unreadCount: (c.unreadCount || 0) + 1,
                  }
                : c
            )
            .sort(
              (a, b) =>
                new Date(b.lastTime || 0).getTime() -
                new Date(a.lastTime || 0).getTime()
            );

          return updated;
        }

        // 新聊天室 → 重新讀一次清單
        loadChats();
        return prev;
      });
    });

    return () => {
      socket?.off("notify-message");
    };
  }, [me]);

  const filteredChats = chats.filter((c) => {
    if (currentTab === "MATCH") return c.source === "MATCH";
    return c.source === "ACTIVITY_CARD" || c.source === "ACTIVITY_TRIP";
  });

  return (
    <main className="pt-[65px] bg-inherit flex justify-center">
      <div className="w-full max-w-[1100px] mx-auto px-0">
        {/* Tabs */}
        <div className="flex items-center gap-14 mt-2 mb-8 px-6">
          <button
            onClick={() => setCurrentTab("MATCH")}
            className={`
              text-[34px] font-semibold px-12 py-4 rounded-[40px] transition-all
              ${
                currentTab === "MATCH"
                  ? "bg-[#dedede] text-black shadow"
                  : "text-gray-600"
              }
            `}
            style={{ border: "none" }}
          >
            配對
          </button>

          <button
            onClick={() => setCurrentTab("ACTIVITY")}
            className={`
              text-[34px] font-semibold px-12 py-4 rounded-[40px] transition-all
              ${
                currentTab === "ACTIVITY"
                  ? "bg-[#dedede] text-black shadow"
                  : "text-gray-600"
              }
            `}
            style={{ border: "none" }}
          >
            活動
          </button>
        </div>

        <div className="w-full h-[2px] bg-[#6a6a6a] mb-6" />

        <div className="w-full px-6">
          {filteredChats.length === 0 && (
            <div className="text-center text-[22px] text-gray-500 py-16">
              {currentTab === "MATCH"
                ? "目前沒有配對對象"
                : "目前沒有活動聯絡人"}
            </div>
          )}

          {filteredChats.map((c) => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex items-center justify-between py-8 border-b border-[#c7c7c7] no-underline"
            >
              <div className="flex items-center gap-10">
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    className="w-[80px] h-[80px] rounded-full object-cover"
                  />
                ) : (
                  <div className="w-[80px] h-[80px] rounded-full bg-[#c8c8c8] flex items-center justify-center">
                    <div className="w-[60px] h-[60px] rounded-full bg-[#b3b3b3]" />
                  </div>
                )}

                <div>
                  <p className="text-[26px] font-semibold text-black">
                    {c.displayName}
                  </p>
                  <p className="text-[20px] text-[#8e8e8e] mt-3 truncate">
                    {c.lastMessage}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end mr-2">
                <span className="text-[16px] text-gray-600 mb-2">
                  {formatTime(c.lastTime)}
                </span>

                {(() => {
                  const count = c.unreadCount ?? 0;
                  return count > 0 ? (
                    <span className="min-w-[28px] px-[6px] py-[3px] bg-red-500 text-white text-xs rounded-full text-center">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null;
                })()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
