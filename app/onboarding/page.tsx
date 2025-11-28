"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";



export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interests, setInterests] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const CITY_OPTIONS = [
    "台北市","新北市","桃園市","台中市","台南市","高雄市",
    "基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣",
    "南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣",
    "台東縣","澎湖縣","金門縣","連江縣"
  ];

  const INTEREST_OPTIONS = [
    "散步 / 走路","聊天喝茶","打牌 / 麻將","桌遊 / 撲克牌",
    "唱歌 / 卡拉OK","跳舞","看書 / 寫字","看電視 / 追劇",
    "看電影","下棋","園藝 / 種花","做菜 / 烘焙",
    "手作 / 編織","旅遊 / 郊遊","爬山 / 輕健行",
    "宗教活動","志工服務"
  ];

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => {
        if (d.user?.onboardingCompleted) {
          router.push("/discovery"); // ⭐ 已完成 → 不需要再填
        }
      });
  }, []);
  

  // === 讀取資料 ===
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 401) {
          router.push("/");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d?.user) return;
        const u = d.user;

        setDisplayName(u.displayName || "");
        setGender(u.gender || "");
        setCity(u.city || "");
        setAgeGroup(u.ageGroup || "");
        setBio(u.bio || "");
        setAvatarUrl(u.avatarUrl || "");
        setGalleryUrls(u.galleryUrls || []);

        if (u.interests) {
          const arr = u.interests.split(/[,，、\s]+/).filter(Boolean);
          setSelectedInterests(arr);
          setInterests(arr.join("、"));
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function canNext() {
    if (step === 0) return displayName && gender;
    if (step === 1) return city && ageGroup;
    if (step === 2) return interests && bio;
    if (step === 3) return avatarUrl;
    return false;
  }

  function toggleInterest(item: string) {
    setSelectedInterests((prev) => {
      const next = prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item];

      setInterests(next.join("、"));
      return next;
    });
  }

  async function handleFinish() {
    setMsg("儲存中...");

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName, gender, city, ageGroup,
        interests, bio, avatarUrl, galleryUrls
      }),
    });

    if (res.ok) {
      setMsg("完成！即將前往配對頁...");
      setTimeout(() => router.push("/discovery"), 700);
    } else {
      setMsg("儲存失敗，請再試一次");
    }
  }

  if (loading) {
    return (
      <main className="onboard-bg flex items-center justify-center">
        <p className="text-xl">載入中...</p>
      </main>
    );
  }

  return (
    <main className="onboard-bg">
      <div className="onboard-content">

        <div className="step-block">

          <div className="paper-title-wrap">
            <img src="/topic.png" className="paper-title-img" />
          </div>

          <p className="ob-step">步驟 {step + 1} / 4</p>

          {/* === STEP 0 === */}
            {step === 0 && (
              <div className="step0">

                <div className="qa-row">
                  <img src="/name.png" className="qa-label-img" />

                  <input
                    className="ob-input"
                    placeholder="輸入暱稱"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="qa-row gender-block">
                  <img src="/gender.png" className="qa-label-img" />

                  <div className="ob-row">
                    <button
                      className={`ob-select ${gender==="男" ? "ob-active-m" : ""}`}
                      onClick={() => setGender("男")}
                    >男</button>

                    <button
                      className={`ob-select ${gender==="女" ? "ob-active-f" : ""}`}
                      onClick={() => setGender("女")}
                    >女</button>
                  </div>
                </div>

              </div>
            )}

              {step === 1 && (
                <div className="step1-container">
                <div className="qa-row step1-row">

                <img src="/location.png" className="qa-label-img" />

                <div className="ob-grid">
                  {CITY_OPTIONS.map((c) => (
                    <button
                      key={c}
                      className={`ob-tag ${city === c ? "ob-active-city" : ""}`}
                      onClick={() => setCity(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* === 年齡層 === */}
              <div className="qa-row step1-row">
                <img src="/age.png" className="qa-label-img" />

                <select
                  className="ob-input"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  <option value="">請選擇</option>
                  <option value="60-65">60-65</option>
                  <option value="66-70">66-70</option>
                  <option value="71-75">71-75</option>
                  <option value="76-80">76-80</option>
                  <option value="80以上">80以上</option>
                </select>
              </div>
            </div>
          )}


          {/* === STEP 2 === */}
            {step === 2 && (
              <>
                {/* 興趣 */}
                <div className="qa-row step2-row">
                  <img src="/interest.png" className="qa-label-img step2-label" />

                  <div className="ob-grid">
                    {INTEREST_OPTIONS.map((opt) => {
                      const active = selectedInterests.includes(opt);
                      return (
                        <button
                          key={opt}
                          className={`ob-tag ${active ? "ob-active-hobby" : ""}`}
                          onClick={() => toggleInterest(opt)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 自我介紹 */}
                <div className="qa-row step2-row">
                  <img src="/intro.png" className="qa-label-img step2-label" />

                  <textarea
                    placeholder="輸入一段話介紹自己吧（必填）"
                    className="ob-textarea"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </>
            )}
{/* === STEP 3 (照片) === */}
{step === 3 && (
   <div className="step3">
    {/* 頭貼 */}
    <div className="qa-row step3-row">
      <img src="/head.png" className="qa-label-img" />

      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const fd = new FormData();
          fd.append("file", f);
          const r = await fetch("/api/upload", {
            method: "POST",
            body: fd,
          });
          const d = await r.json();
          setAvatarUrl(d.url);
        }}
      />

      {avatarUrl && <img src={avatarUrl} className="ob-avatar" />}
    </div>

    {/* 生活照 */}
    <div className="qa-row step3-row">
      <img src="/life.png" className="qa-label-img" />

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={async (e) => {
          const files = e.target.files;
          if (!files) return;

          const urls: string[] = [];
          for (const f of Array.from(files)) {
            const fd = new FormData();
            fd.append("file", f);
            const r = await fetch("/api/upload", {
              method: "POST",
              body: fd,
            });
            const d = await r.json();
            urls.push(d.url);
          }
          setGalleryUrls(urls);
        }}
      />

      {galleryUrls.length > 0 && (
        <div className="ob-gallery">
          {galleryUrls.map((u) => (
            <img key={u} src={u} className="ob-gallery-img" />
          ))}
        </div>
      )}
    </div>
  </div>
)}



  {/* === 下一步 / 完成（右側） === */}
{/* === 下一步 / 完成 按鈕（修正版） === */}
<div className="next-btn-row">

  {/* 上一步（左邊） */}
  {step > 0 ? (
    <div className="prev-btn-wrap">
      <img src="/arrow-left.png" className="prev-btn-arrow" />
      <button className="prev-btn" onClick={() => setStep(step - 1)}>
        上一步
      </button>
    </div>
  ) : (
    <div></div>
  )}

  {/* 下一步 or 完成（右邊） */}
  <div className="next-btn-wrap">
    {step < 3 ? (
      <>
        <button
          disabled={!canNext()}
          className={`next-btn ${!canNext() ? "ob-disabled" : ""}`}
          onClick={() => canNext() && setStep(step + 1)}
        >
          下一步
        </button>
        <img src="/arrow-right.png" className="next-btn-arrow" />
      </>
    ) : (
      <>
        <button
          disabled={!canNext()}
          className={`next-btn ${!canNext() ? "ob-disabled" : ""}`}
          onClick={handleFinish}
        >
          完成並開始配對
        </button>
        <img src="/arrow-right.png" className="next-btn-arrow" />
      </>
    )}
  </div>




</div>

        </div>
      </div>
    </main>
  );
}
