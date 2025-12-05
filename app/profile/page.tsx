"use client";

import React, { useEffect, useState } from "react";

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

async function logout() {
  await fetch("/api/logout", { method: "POST" });
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
          const p: Profile = {
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
      })
      .catch((err) => {
        console.error("fetch profile error", err);
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
    if (!p.avatarUrl?.trim()) return "請填寫頭貼"; // 若想改成非必要，可移除此行
    return "";
  }

  // 儲存資料
  async function saveEdit() {
    if (!editData) return;
    setError("");
    const v = validate(editData);
    if (v) return setError(v);

    const payload = {
      ...editData,
      galleryUrls: editData.galleryUrls?.filter((x) => x.trim() !== "") ?? [],
    };

    try {
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
        const text = await res.text();
        console.error("save failed", text);
        setError("儲存失敗");
      }
    } catch (err) {
      console.error(err);
      setError("儲存失敗 (network)");
    }
  }

  // 檔案轉 Base64 helper（回傳 Promise<string>）
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <main className="profile-bg">
      <div className="profile-big-card">
        <div className="flex flex-col items-center py-10">
          <img
            src={profile.avatarUrl || "/default-avatar.png"}
            className="profile-avatar"
            alt="avatar"
          />

          <div className="flex items-center gap-3 mt-6">
            <p className="profile-name">{profile.displayName}</p>

            {profile.gender === "女" && (
              <img src="/female.png" className="w-[36px] h-[36px]" alt="female" />
            )}
            {profile.gender === "男" && (
              <img src="/male.png" className="w-[36px] h-[36px]" alt="male" />
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => {
                setEditData(profile);
                setOpenEdit(true);
                setError("");
              }}
              className="profile-edit-btn"
            >
              <img src="/edit.png" className="w-[22px] h-[22px]" alt="edit" />
              修改資料
            </button>

            <button onClick={logout} className="logout-btn">登出</button>
          </div>
        </div>

        <div className="profile-inner-box">
          <div className="profile-left">
            <p className="profile-left-title">生活照</p>

            {profile.galleryUrls && profile.galleryUrls.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {profile.galleryUrls.map((url, i) => (
                  <img key={i} src={url} className="profile-gallery-img" alt={`gallery-${i}`} />
                ))}
              </div>
            ) : (
              <div className="profile-gallery-placeholder" />
            )}
          </div>

          <div className="profile-info">
            <p><span>性別：</span>{profile.gender}</p>
            <p><span>年齡層：</span>{profile.ageGroup}</p>
            <p><span>居住地：</span>{profile.city}</p>
            <p><span>興趣：</span>{profile.interests}</p>
            <p><span>自我介紹：</span>{profile.bio}</p>
          </div>
        </div>
      </div>

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
                  <option key={age} value={age}>{age}</option>
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
                  <option key={city} value={city}>{city}</option>
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
              />
            </div>

            {/* 頭貼預覽 + 上傳 */}
            <div className="modal-field">
              <label>頭貼</label>

              <img
                src={editData.avatarUrl || "/default-avatar.png"}
                className="w-[120px] h-[120px] rounded-full object-cover border mb-3"
                alt="avatar-preview"
              />

              <input
                type="file"
                accept="image/*"
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await fileToDataUrl(file);
                    setEditData({ ...editData, avatarUrl: dataUrl });
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
            </div>

            {/* 生活照（多張） */}
            <div className="modal-field">
              <label>生活照</label>

              <div className="flex flex-wrap gap-3 mb-3">
                {editData.galleryUrls && editData.galleryUrls.length > 0 ? (
                  editData.galleryUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        className="w-[100px] h-[100px] object-cover rounded-md border"
                        alt={`gallery-${index}`}
                      />
                      <button
                        onClick={() => {
                          const newList = (editData.galleryUrls || []).filter(
                            (_, i) => i !== index
                          );
                          setEditData({ ...editData, galleryUrls: newList });
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                        type="button"
                      >
                        X
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">目前沒有生活照</p>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  const arr = Array.from(files);
                  try {
                    const dataUrls = await Promise.all(arr.map(fileToDataUrl));
                    setEditData({
                      ...editData,
                      galleryUrls: [...(editData.galleryUrls || []), ...dataUrls],
                    });
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
            </div>

            {/* 按鈕 */}
            <div className="modal-btns">
              <button className="btn-save" onClick={saveEdit}>儲存</button>
              <button className="btn-cancel" onClick={() => setOpenEdit(false)}>取消</button>
            </div>

            {error && <p className="modal-error">{error}</p>}
            {msg && <p className="modal-msg">{msg}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
