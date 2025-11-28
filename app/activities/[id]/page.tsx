// app/activities/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  location: string;
  capacity: number | null;   // 👈 改：可為 null
  joinedCount: number;
  joined: boolean;

  // 主辦人資訊
  creatorId: string;
  creatorName: string;
  creatorPhone?: string | null;

  category?: string | null;
};

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [a, setA] = useState<Activity | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/activities?id=${id}`)
      .then((r) => r.json())
      .then((d) => setA(d.activity))
      .catch(() => setMsg("讀取活動失敗"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function join(action: "join" | "leave") {
    if (!a) return;
    setLoading(true);
    setMsg("處理中...");

    const wantJoin = action === "join";

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: id, join: wantJoin }),
      });

      const d = await res.json();

      if (res.ok) {
        // 直接即時更新本頁狀態
        setA((prev) =>
          prev
            ? {
                ...prev,
                joined: wantJoin,
                joinedCount:
                  typeof d.joinedCount === "number"
                    ? d.joinedCount
                    : prev.joinedCount,
              }
            : prev
        );
        setMsg(d.message || "");
      } else if (res.status === 401) {
        setMsg("請先登入");
        router.push("/auth");
      } else {
        setMsg(d.error || "操作失敗");
      }
    } catch {
      setMsg("伺服器錯誤");
    } finally {
      setLoading(false);
    }
  }

  if (!a) {
    return (
      <main className="min-h-screen bg-amber-50 p-6 flex items-center justify-center">
        <p className="text-xl">
          {loading ? "載入中..." : msg || "找不到活動"}
        </p>
      </main>
    );
  }

  const hasCapacity = a.capacity != null;
  const full = hasCapacity && a.joinedCount >= (a.capacity as number);

  return (
    <main
      id="main"
      className="min-h-screen bg-amber-50 p-6 flex flex-col items-center"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
          {a.title}
        </h1>

        <p className="text-lg text-neutral-800 whitespace-pre-line mb-3">
          {a.description || "—"}
        </p>

        <p className="text-lg text-neutral-700">
          📅日期： {new Date(a.date).toLocaleString()}
        </p>
        <p className="text-lg text-neutral-700">📍地點： {a.location}</p>

        {/* 名額文字：有設定上限 / 沒設定上限 */}
        {hasCapacity ? (
          <p className="text-lg text-neutral-700 mt-1">
            名額：{a.joinedCount} / {a.capacity} {full && "（已額滿）"}
          </p>
        ) : (
          <p className="text-lg text-neutral-700 mt-1">
            目前已報名：{a.joinedCount} 位朋友
          </p>
        )}

        {/* 主辦人資訊 */}
        <p className="text-lg text-neutral-700 mt-3">
          👤 主辦人：<span className="font-semibold">{a.creatorName || "—"}</span>
        </p>
        <p className="text-lg text-neutral-700 mt-1">
          📞 主辦人聯絡電話：
          <span className="font-semibold">
            {a.creatorPhone && a.creatorPhone.trim()
              ? a.creatorPhone
              : "尚未提供"}
          </span>
        </p>

        {msg && <p className="text-blue-700 text-lg mt-3">{msg}</p>}

        <div className="mt-5 flex gap-3 flex-wrap">
          {a.joined ? (
            <button
              disabled={loading}
              onClick={() => join("leave")}
              className="text-xl rounded-2xl bg-gray-200 hover:bg-gray-300 focus-visible:outline focus-visible:outline-4 px-5 py-3"
            >
              取消報名
            </button>
          ) : (
            <button
              disabled={loading || full}
              onClick={() => join("join")}
              className="text-xl rounded-2xl bg-green-300 hover:bg-green-400 focus-visible:outline focus-visible:outline-4 px-5 py-3 disabled:opacity-50"
            >
              我要報名
            </button>
          )}

          {/* 報名後才能聯絡主辦人（用現有聊天室系統） */}
        <button
          type="button"
          disabled={!a.joined}
          onClick={() => {
            router.push(`/chat/${a.creatorId}?from=activity&activityId=${a.id}`);
          }}
          className={`text-xl rounded-2xl px-5 py-3 border ${
            a.joined
              ? "bg-blue-300 hover:bg-blue-400 border-blue-500 text-black"
              : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
          }`}
        >
          📩 聯絡主辦人
        </button>

        </div>
      </div>
    </main>
  );
}
