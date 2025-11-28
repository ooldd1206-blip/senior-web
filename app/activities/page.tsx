"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  category: string;
  joined: boolean;
  joinedCount: number;
  creator?: { displayName: string };
  participants?: any[];
};

type MyJoin = {
  activity: {
    id: string;
    title: string;
    date: string;
  };
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [msg, setMsg] = useState("");
  const [me, setMe] = useState<string>("");

  // ⭐ 篩選視窗開關
  const [showFilter, setShowFilter] = useState(false);

  // ⭐ 篩選條件
  const [filterMain, setFilterMain] = useState<"all" | "card" | "trip">("all");
  const [filterSub, setFilterSub] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.id) setMe(d.user.id);
      });
  }, []);

  /* =================== 讀取所有活動 =================== */
  async function load() {
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data.activities || []);
    } catch {
      setMsg("讀取活動清單失敗");
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* =================== 我要報名 / 取消報名 =================== */
  async function toggleJoin(id: string, joined: boolean) {
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: id, join: !joined }),
      });

      const d = await res.json();

      if (res.ok) {
        setActivities((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  joined: !joined,
                  joinedCount: d.joinedCount,
                  participants: Array(d.joinedCount).fill(1),
                }
              : a
          )
        );
      } else {
        setMsg(d.error || "操作失敗");
      }
    } catch {
      setMsg("伺服器錯誤");
    }
  }

  /* =================== 活動詳情彈窗 =================== */
  const [detail, setDetail] = useState<any | null>(null);

  async function openDetail(id: string) {
    const res = await fetch(`/api/activities?id=${id}`);
    const data = await res.json();
    setDetail(data.activity);
  }

  function closeDetail() {
    setDetail(null);
  }

  /* =================== 報名列表彈窗 =================== */
  const [myJoins, setMyJoins] = useState<MyJoin[] | null>(null);

  async function openMyJoins() {
    const res = await fetch("/api/my-joins");
    const data = await res.json();
    setMyJoins(data.joins || []);
  }

  function closeMyJoins() {
    setMyJoins(null);
  }

  async function cancelJoinFromList(activityId: string) {
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, join: false }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "取消失敗");
      return;
    }

    // 更新彈窗 UI
    setMyJoins((prev) => prev!.filter((j) => j.activity.id !== activityId));

    // 更新主列表 UI
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              joined: false,
              joinedCount: data.joinedCount,
              participants: Array(data.joinedCount).fill(1),
            }
          : a
      )
    );
  }

  /* =================== 篩選邏輯 =================== */
  function filterActivity(a: Activity) {
    // 大分類
    if (filterMain === "card" && !a.category.includes("牌")) return false;
    if (filterMain === "trip" && !a.category.includes("旅")) return false;

    // 小分類
  if (filterSub !== "all") {
    const text = (a.title ?? "") + " " + (a.description ?? "");
    if (!text.includes(filterSub)) return false;
  }

    // 日期
    const activityDate = new Date(a.date);

    if (startDate) {
      const s = new Date(startDate);
      if (activityDate < s) return false;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59);
      if (activityDate > e) return false;
    }

    return true;
  }

  /* =================== 篩選重設 =================== */
  function resetFilter() {
    setFilterMain("all");
    setFilterSub("all");
    setStartDate("");
    setEndDate("");
  }

  return (
    <main className="activities-new-page min-h-screen w-full flex flex-col items-center px-4 pt-[70px]">

      {/* 上方：報名列表 + 創建活動 + 篩選 */}
      <div className="activities-new-header">
        <button className="activities-new-tab" onClick={openMyJoins}>
          報名列表
        </button>

        <Link href="/activities/create" className="activities-new-create">
          創建活動
        </Link>

        <button
          onClick={() => setShowFilter(true)}
          className="activities-new-fliter"
        >
          篩選
        </button>

      </div>

      {/* 活動卡片 */}
      <div className="activities-new-list">
        {activities.filter(filterActivity).length === 0 && (
          <p className="text-center text-2xl text-neutral-600 mt-8">
            目前尚未有此類活動，歡迎建立活動。
          </p>
        )}

        {activities.filter(filterActivity).map((a) => (
          <div key={a.id} className="activities-new-card">
            <div
              className={`activities-new-tag ${
                a.category.includes("牌") ? "tag-green" : "tag-yellow"
              }`}
            >
              {a.creator?.displayName ?? "使用者"} ＞ {a.category}
            </div>

            <p className="activities-new-title">{a.title}</p>

            <p className="text-[26px] text-neutral-700 mb-3 leading-relaxed">
              {a.description}
            </p>

            <div className="activities-new-info-row">
              <img src="/date.png" className="activities-new-icon" />
              <span>{new Date(a.date).toLocaleString()}</span>
            </div>

            <div className="activities-new-info-row">
              <img src="/people.png" className="activities-new-icon" />
              <span>
                目前參加：{a.participants?.length ?? a.joinedCount} 人
              </span>
            </div>

            <div className="activities-new-actions">
              <button
                onClick={() => toggleJoin(a.id, a.joined)}
                className={`activities-new-join ${a.joined ? "cancel" : ""}`}
              >
                {a.joined ? "取消報名" : "我要報名"}
              </button>

              <button
                onClick={() => openDetail(a.id)}
                className="activities-new-detail"
              >
                查看活動詳情
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* ⭐⭐ 篩選彈跳視窗 Modal ⭐⭐ */}
      {/* ========================================================= */}
      {showFilter && (
        <div className="detail-mask">
          <div className="detail-panel">

            <h2 className="detail-title">活動篩選</h2>

            {/* 大分類 */}
            <div className="flex gap-3 mt-4">
              {["all", "card", "trip"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setFilterMain(t as any);
                    setFilterSub("all");
                  }}
                  className={`filter-btn ${
                    filterMain === t
                      ? t === "card"
                        ? "active green-main"  // ⭐ 找牌咖＝綠色
                        : "active yellow"      // ⭐ 其他維持黃色
                      : ""
                  }`}
                >
                  {t === "all"
                    ? "全部"
                    : t === "card"
                    ? "找牌咖"
                    : "找旅伴"}
                </button>
              ))}
            </div>



            {/* 小分類：找牌咖 */}
            {filterMain === "card" && (
              <div className="flex gap-3 flex-wrap mt-4">
                {["麻將", "橋牌", "撲克牌", "象棋", "五子棋", "其他"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterSub(t)}
                    className={`filter-btn ${
                      filterSub === t ? "active green-sub" : ""
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}




            {/* 小分類：找旅伴 */}
            {filterMain === "trip" && (
              <div className="flex gap-3 flex-wrap mt-4">
                {["爬山", "散步", "吃飯", "看電影", "一日遊", "其他"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterSub(t)}
                    className={`filter-btn ${
                      filterSub === t ? "active yellow-sub" : ""
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}




            {/* 日期 */}
            <div className="mt-6">
              <p className="text-[22px] font-semibold mb-2">依日期篩選</p>

              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[18px] mb-1">開始日期</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-400 text-[18px]"
                  />
                </div>

                <div className="flex flex-col">
                  <span className="text-[18px] mb-1">結束日期</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-400 text-[18px]"
                  />
                </div>
              </div>
            </div>

            {/* 按鈕 */}
            <div className="detail-actions mt-8">
              <button
                className="detail-contact-btn bg-blue-300 hover:bg-blue-400"
                onClick={() => setShowFilter(false)}
              >
                搜尋
              </button>

              <button
                className="detail-close-btn"
                onClick={() => {
                  resetFilter();
                  setShowFilter(false);
                }}
              >
                重置
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 活動詳情彈窗 */}
      {/* ========================================================= */}
      {detail && (
        <div className="detail-mask">
          <div className="detail-panel">

            <h2 className="detail-title">{detail.title}</h2>
            <p className="detail-subtitle">{detail.description}</p>

            <div className="detail-row">
              <img src="/date.png" className="detail-icon" />
              <span>日期：{new Date(detail.date).toLocaleString()}</span>
            </div>

            <div className="detail-row">
              <img src="/place.png" className="detail-icon" />
              <span>地點：{detail.location}</span>
            </div>

            <div className="detail-row">
              <img src="/participants.png" className="detail-icon" />
              <span>
                名額：{detail.joinedCount}/{detail.capacity ?? "?"}
                {detail.capacity &&
                  detail.joinedCount >= detail.capacity &&
                  "（已額滿）"}
              </span>
            </div>

            <div className="detail-row">
              <img src="/host.png" className="detail-icon" />
              <span>主辦人：{detail.creatorName}</span>
            </div>

            <div className="detail-row">
              <img src="/phone.png" className="detail-icon" />
              <span>主辦人聯絡電話：{detail.creatorPhone}</span>
            </div>

            <div className="detail-actions">
              {me !== detail.creatorId && (
                <button
                  className="detail-contact-btn"
                  onClick={async () => {
                    const hostId = detail.creatorId;
                    const activityId = detail.id;

                    const from =
                      detail.category?.includes("牌")
                        ? "card"
                        : detail.category?.includes("旅")
                        ? "trip"
                        : "activity";

                    await fetch("/api/messages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        receiverId: hostId,
                        content: "您好，我想詢問活動相關問題！",
                        source:
                          from === "card"
                            ? "ACTIVITY_CARD"
                            : from === "trip"
                            ? "ACTIVITY_TRIP"
                            : "ACTIVITY",
                        activityId,
                      }),
                    });

                    window.location.href = `/chat/${hostId}?from=${from}&activityId=${activityId}`;
                  }}
                >
                  聯絡主辦人
                </button>
              )}

              <button className="detail-close-btn" onClick={closeDetail}>
                取消
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 我已報名的活動彈窗 */}
      {/* ========================================================= */}
      {myJoins !== null && (
        <div className="detail-mask">
          <div className="detail-panel">

            <h2 className="detail-title">我已報名的活動</h2>

            {myJoins.length === 0 && (
              <p className="text-xl text-neutral-700 mt-4">
                目前沒有報名任何活動
              </p>
            )}

            {myJoins.map((item) => (
              <div
                key={item.activity.id}
                className="detail-row mt-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-[26px]">● {item.activity.title}</p>
                  <p className="text-[22px] text-neutral-600 ml-8">
                    {new Date(item.activity.date).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => cancelJoinFromList(item.activity.id)}
                  className="detail-close-btn px-6 py-2 text-[22px]"
                >
                  取消報名
                </button>
              </div>
            ))}

            <div className="detail-actions mt-6">
              <button className="detail-close-btn" onClick={closeMyJoins}>
                關閉
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
