"use client";

import { useEffect, useState } from "react";

type Profile = {
  displayName: string;
  gender: string;
  ageGroup: string;
  city: string;
  interests: string;
  bio: string;
  avatarUrl?: string | null;
  galleryUrls?: string[];
};

/* 台灣縣市下拉式選單 */
const CITY_OPTIONS = [
  "台北市","新北市","桃園市","台中市","台南市","高雄市",
  "基隆市","新竹市","嘉義市","新竹縣","苗栗縣","彰化縣",
  "南投縣","雲林縣","嘉義縣","屏東縣","宜蘭縣","花蓮縣",
  "台東縣","澎湖縣","金門縣","連江縣"
];

/* 年齡層 */
const AGE_OPTIONS = [
  "50-55","55-60","60-65","65-70","70-75","75+" 
];

/* 興趣 (給下拉用，亦可換成 checkbox 組合) */
const INTEREST_OPTIONS = [
  "散步","做菜","烘焙","看電影","追劇","登山","慢跑",
  "旅遊","桌遊","唱歌","跳舞"
];

async function logout() {
  await fetch("/api/logout", { method: "POST" });

  // 跳回登入頁
  window.location.href = "/";
}


export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    displayName: "",
    gender: "",
    ageGroup: "",
    city: "",
    interests: "",
    bio: "",
    avatarUrl: "",
    galleryUrls: [],
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<Profile | null>(null);

  // 讀取資料
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((d) => {
        if (d?.user) {
          const p = {
            displayName: d.user.displayName || "",
            gender: d.user.gender || "",
            ageGroup: d.user.ageGroup || "",
            city: d.user.city || "",
            interests: d.user.interests || "",
            bio: d.user.bio || "",
            avatarUrl: d.user.avatarUrl || "",
            galleryUrls: Array.isArray(d.user.galleryUrls)
              ? d.user.galleryUrls
              : [],
          };
          setProfile(p);
        }
      });
  }, []);

  // 驗證
  function validate(p: Profile) {
    if (!p.displayName.trim()) return "請填寫顯示名稱";
    if (!p.gender.trim()) return "請選擇性別";
    if (!p.ageGroup.trim()) return "請選擇年齡層";
    if (!p.city.trim()) return "請選擇居住地";
    if (!p.interests.trim()) return "請填寫興趣";
    if (!p.bio.trim()) return "請填寫自我介紹";
    if (!p.avatarUrl?.trim()) return "請填寫頭貼網址";
    return "";
  }

  // 儲存資料
  async function saveEdit() {
    if (!editData) return;

    const v = validate(editData);
    if (v) return setError(v);

    const payload = {
      ...editData,
      galleryUrls: editData.galleryUrls?.filter((x) => x.trim() !== "") ?? [],
    };

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setProfile(editData);
      setMsg("已儲存");
      setOpenEdit(false);
    } else {
      setError("儲存失敗");
    }
  }

  return (
    <main className="profile-bg">

      {/* ======= 大框 ======= */}
      <div className="profile-big-card">

        {/* ===== 頭貼 / 名字 / 性別 / 修改資料 ===== */}
        <div className="flex flex-col items-center py-10">

          <img
            src={profile.avatarUrl || "/default-avatar.png"}
            className="profile-avatar"
          />

          <div className="flex items-center gap-3 mt-6">
            <p className="profile-name">{profile.displayName}</p>

            {profile.gender === "女" && (
              <img src="/female.png" className="w-[36px] h-[36px]" />
            )}
            {profile.gender === "男" && (
              <img src="/male.png" className="w-[36px] h-[36px]" />
            )}
          </div>

          {/* 修改資料按鈕 + 登出按鈕 */}
          <div className="flex gap-4 mt-4">

            {/* 修改資料 */}
            <button
              onClick={() => {
                setEditData(profile);
                setOpenEdit(true);
              }}
              className="profile-edit-btn"
            >
              <img src="/edit.png" className="w-[22px] h-[22px]" />
              修改資料
            </button>

            {/* 登出 */}
            <button
              onClick={logout}
              className="logout-btn"
            >
              登出
            </button>

          </div>

        </div>

        {/* ===== 灰底下半部 ===== */}
        <div className="profile-inner-box">

          {/* 左：生活照 */}
          <div className="profile-left">
            <p className="profile-left-title">生活照</p>

            {profile.galleryUrls && profile.galleryUrls.length > 0 ? (
              profile.galleryUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  className="profile-gallery-img"
                />
              ))
            ) : (
              <div className="profile-gallery-placeholder" />
            )}
          </div>

          {/* 右：資料 */}
          <div className="profile-info">
            <p><span>性別：</span>{profile.gender}</p>
            <p><span>年齡層：</span>{profile.ageGroup}</p>
            <p><span>居住地：</span>{profile.city}</p>
            <p><span>興趣：</span>{profile.interests}</p>
            <p><span>自我介紹：</span>{profile.bio}</p>
          </div>

        </div>
      </div>

      {/* ========== 修改資料彈跳視窗 ========== */}
      {openEdit && editData && (
        <div className="profile-modal-mask">
          <div className="profile-modal">

            <h2 className="modal-title">修改資料</h2>

            {/* 顯示名稱 */}
            <div className="modal-field">
              <label>顯示名稱</label>
              <input
                value={editData.displayName}
                onChange={(e) =>
                  setEditData({ ...editData, displayName: e.target.value })
                }
              />
            </div>

            {/* 性別 */}
            <div className="modal-field">
              <label>性別</label>
              <select
                value={editData.gender}
                onChange={(e) =>
                  setEditData({ ...editData, gender: e.target.value })
                }
              >
                <option value="">請選擇</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>

            {/* 年齡層 */}
            <div className="modal-field">
              <label>年齡層</label>
              <select
                value={editData.ageGroup}
                onChange={(e) =>
                  setEditData({ ...editData, ageGroup: e.target.value })
                }
              >
                <option value="">請選擇</option>
                {AGE_OPTIONS.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            {/* 居住地 */}
            <div className="modal-field">
              <label>居住地</label>
              <select
                value={editData.city}
                onChange={(e) =>
                  setEditData({ ...editData, city: e.target.value })
                }
              >
                <option value="">請選擇</option>
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* 興趣 */}
            <div className="modal-field">
              <label>興趣</label>
              <input
                value={editData.interests}
                onChange={(e) =>
                  setEditData({ ...editData, interests: e.target.value })
                }
              />
            </div>

            {/* 自我介紹 */}
            <div className="modal-field">
              <label>自我介紹</label>
              <textarea
                value={editData.bio}
                onChange={(e) =>
                  setEditData({ ...editData, bio: e.target.value })
                }
              ></textarea>
            </div>

            {/* 頭貼網址 */}
            <div className="modal-field">
              <label>頭貼網址</label>
              <input
                value={editData.avatarUrl || ""}
                onChange={(e) =>
                  setEditData({ ...editData, avatarUrl: e.target.value })
                }
              />
            </div>

            {/* 按鈕 */}
            <div className="modal-btns">
              <button className="btn-save" onClick={saveEdit}>儲存</button>
              <button className="btn-cancel" onClick={() => setOpenEdit(false)}>取消</button>
            </div>

            {error && <p className="modal-error">{error}</p>}

          </div>
        </div>
      )}


    </main>
  );
}
