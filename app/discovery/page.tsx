"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  displayName: string;
  email: string;
  gender?: string | null;
  ageGroup?: string | null;
  city?: string | null;
  interests?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  galleryUrls?: string[] | null;
};

export default function Discovery() {
  const [users, setUsers] = useState<User[]>([]);
  const [index, setIndex] = useState(0);

  const [showHeart, setShowHeart] = useState(false);    // ❤️ 粉蠟筆愛心
  const [heartText, setHeartText] = useState("");       // ❤️ 動畫內文字
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);

  // ⭐ 載入其他使用者
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.users)) setUsers(d.users);
        else console.log("讀取使用者失敗");
      })
      .catch(() => console.log("伺服器錯誤"));
  }, []);

  const user = users[index];

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-3xl">目前沒有更多使用者</p>
      </main>
    );
  }

  // ⭐ 照片處理
  const gallery = (user.galleryUrls ?? []).filter(Boolean);
  const mainPhoto = user.avatarUrl || gallery[0] || null;
  const lifePhotos = gallery.filter((url) => url !== mainPhoto).slice(0, 3);
  const lifeSlots = [0, 1, 2].map((i) => lifePhotos[i] ?? null);

  // ⭐ 下一位
  function nextUser() {
    setSlideDir(null);
    setIndex((i) => i + 1);
  }

  // ⭐ 喜歡（含愛心動畫）
  async function like() {
    const u = user;
    if (!u?.id) return;

    // ❤️ 顯示粉蠟筆心與文字
    setHeartText(`已送出喜歡給 ${u.displayName}`);
    setShowHeart(true);
    setSlideDir("right");

    // 動畫結束→自動下一位
    setTimeout(() => {
      setShowHeart(false);
      nextUser();
    }, 1200);

    // 送到後端 (不顯示 msg)
    try {
      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likedId: String(u.id) }),
      });
    } catch {
      console.log("送出喜歡失敗");
    }
  }

  // ⭐ 略過
  function skip() {
    setSlideDir("left");
    setTimeout(nextUser, 500);
  }

  return (
    <main className="discovery-page">

      {/* ❤️ 粉蠟筆手繪愛心動畫 */}
      {showHeart && (
        <div className="heart-anim">
          <img src="/heart.png" className="heart-img" />
          <div className="heart-text">{heartText}</div>
        </div>
      )}

      {/* 🔍 點擊照片放大 */}
      {previewImg && (
        <div className="img-preview" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="preview" />
        </div>
      )}

      <div className={`discovery-card slide-${slideDir ?? "none"}`}>

        {/* ⭐ 上半部：大頭貼 + 生活照 */}
        <section className="discovery-top">

          {/* 大頭貼 */}
          <div className="discovery-avatar-wrap">
            {mainPhoto ? (
              <img
                src={mainPhoto}
                className="discovery-avatar-img"
                alt="頭貼"
                onClick={() => setPreviewImg(mainPhoto)}
              />
            ) : (
              <div className="discovery-avatar-placeholder" />
            )}
          </div>

          {/* 姓名 + 性別 + 生活照 */}
          <div className="discovery-right">
            <div className="discovery-name-row">
              <span className="discovery-name">{user.displayName}</span>

              {user.gender === "男" && (
                <span className="discovery-gender discovery-gender-male">♂</span>
              )}
              {user.gender === "女" && (
                <span className="discovery-gender discovery-gender-female">♀</span>
              )}
            </div>

            <div className="discovery-life-row">
              {lifeSlots.map((url, i) =>
                url ? (
                  <img
                    key={i}
                    src={url}
                    className="discovery-life-img"
                    alt="生活照"
                    onClick={() => setPreviewImg(url)}
                  />
                ) : (
                  <div key={i} className="discovery-life-placeholder" />
                )
              )}
            </div>
          </div>
        </section>

        {/* ⭐ 下半部：個人資料 + 按鈕 */}
        <section className="discovery-info-block">
          <p className="discovery-info-text">年齡層：{user.ageGroup || "未提供"}</p>
          <p className="discovery-info-text">居住地：{user.city || "未提供"}</p>
          <p className="discovery-info-text">興趣：{user.interests || "未提供"}</p>
          <p className="discovery-info-text discovery-info-intro">
            自我介紹：{user.bio || "未提供"}
          </p>

          {/* 略過 / 喜歡 */}
          <div className="discovery-actions">
            <button className="discovery-btn" onClick={skip}>
              <img src="/ignore.png" alt="略過" />
            </button>
            <button className="discovery-btn" onClick={like}>
              <img src="/like.png" alt="喜歡" />
            </button>
          </div>
        </section>

      </div>
    </main>
  );
}
