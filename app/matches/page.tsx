"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MatchItem = {
  id: string;
  displayName: string;
  email: string;
  since: string;
  avatarUrl?: string | null;
};

export default function MatchesPage() {
  const [list, setList] = useState<MatchItem[]>([]);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((d) => {
        const seen = new Set<string>();
        const uniq = (d.matches || []).filter((m: any) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setList(uniq);
      })
      .catch(() => setMsg("讀取配對清單失敗"));
  }, []);

  if (!list.length) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-amber-50">
        <div className="text-2xl">目前還沒有互相配對</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">💞 互相配對</h1>
      <div className="w-full max-w-xl space-y-4">
        {list.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-2xl shadow p-5 flex items-center justify-between gap-4"
          >
            {/* 頭貼 */}
            <div className="flex items-center gap-4">
              {m.avatarUrl ? (
                <img
                  src={m.avatarUrl}
                  alt={m.displayName}
                  className="w-14 h-14 rounded-full object-cover border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-pink-200 flex items-center justify-center text-xl font-bold text-neutral-900">
                  {m.displayName.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-2xl font-semibold">{m.displayName}</div>
                <div className="text-neutral-600 text-lg">{m.email}</div>
                <div className="text-neutral-500 text-sm mt-1">
                  自 {new Date(m.since).toLocaleDateString()} 成為互相配對
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/chat/${m.id}`)}
              className="text-xl px-5 py-3 rounded-2xl bg-blue-300 hover:bg-blue-400 focus-visible:outline focus-visible:outline-4"
            >
              開聊
            </button>
          </div>
        ))}
      </div>
      {msg && <p className="mt-4 text-red-600">{msg}</p>}
    </main>
  );
}
