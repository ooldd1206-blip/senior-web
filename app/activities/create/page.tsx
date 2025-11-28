"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

/* ===================== 台灣縣市 + 完整行政區 ===================== */
const taiwanCities: Record<string, string[]> = {
  
  "台北市": ["中正區","大同區","中山區","松山區","大安區","萬華區","信義區","士林區","北投區","內湖區","南港區","文山區"],
  "新北市": ["萬里區","金山區","板橋區","汐止區","深坑區","石碇區","瑞芳區","平溪區","雙溪區","貢寮區","新店區","坪林區","烏來區","永和區","中和區","土城區","三峽區","樹林區","鶯歌區","三重區","新莊區","泰山區","林口區","蘆洲區","五股區","八里區","淡水區","三芝區","石門區"],
  "桃園市": ["中壢區","平鎮區","龍潭區","楊梅區","新屋區","觀音區","桃園區","龜山區","八德區","大溪區","復興區","大園區","蘆竹區"],
  "台中市": ["中區","東區","南區","西區","北區","北屯區","西屯區","南屯區","太平區","大里區","霧峰區","烏日區","豐原區","后里區","石岡區","東勢區","和平區","新社區","潭子區","大雅區","神岡區","大肚區","沙鹿區","龍井區","梧棲區","清水區","大甲區","外埔區","大安區"],
  "台南市": ["中西區","東區","南區","北區","安平區","安南區","永康區","歸仁區","新化區","左鎮區","玉井區","楠西區","南化區","仁德區","關廟區","龍崎區","官田區","麻豆區","佳里區","西港區","七股區","將軍區","學甲區","北門區","新營區","後壁區","白河區","東山區","六甲區","下營區","柳營區","鹽水區","善化區","大內區","山上區","新市區","安定區"],
  "高雄市": ["新興區","前金區","苓雅區","鹽埕區","鼓山區","旗津區","前鎮區","三民區","楠梓區","小港區","左營區","仁武區","大社區","岡山區","路竹區","阿蓮區","田寮區","燕巢區","橋頭區","梓官區","彌陀區","永安區","湖內區","鳳山區","大寮區","林園區","鳥松區","大樹區","旗山區","美濃區","六龜區","內門區","杉林區","甲仙區","桃源區","那瑪夏區","茂林區","茄萣區"],
  "基隆市": ["仁愛區","信義區","中正區","中山區","安樂區","暖暖區","七堵區"],
  "新竹市": ["東區","北區","香山區"],
  "新竹縣": ["竹北市","湖口鄉","新豐鄉","新埔鎮","關西鎮","芎林鄉","寶山鄉","竹東鎮","五峰鄉","橫山鄉","尖石鄉","北埔鄉","峨眉鄉"],
  "苗栗縣": ["竹南鎮","頭份市","三灣鄉","南庄鄉","獅潭鄉","後龍鎮","通霄鎮","苑裡鎮","苗栗市","造橋鄉","頭屋鄉","公館鄉","大湖鄉","泰安鄉","銅鑼鄉","三義鄉","西湖鄉","卓蘭鎮"],
  "彰化縣": ["彰化市","芬園鄉","花壇鄉","秀水鄉","鹿港鎮","福興鄉","線西鄉","和美鎮","伸港鄉","員林市","社頭鄉","永靖鄉","埔心鄉","溪湖鎮","大村鄉","埔鹽鄉","田中鎮","北斗鎮","田尾鄉","埤頭鄉","溪州鄉","竹塘鄉","二林鎮","大城鄉","芳苑鄉","二水鄉"],
  "南投縣": ["南投市","中寮鄉","草屯鎮","國姓鄉","埔里鎮","仁愛鄉","名間鄉","集集鎮","水里鄉","魚池鄉","信義鄉","竹山鎮","鹿谷鄉"],
  "雲林縣": ["斗南鎮","大埤鄉","虎尾鎮","土庫鎮","褒忠鄉","東勢鄉","臺西鄉","崙背鄉","麥寮鄉","斗六市","林內鄉","古坑鄉","莿桐鄉","西螺鎮","二崙鄉","北港鎮","水林鄉","口湖鄉","四湖鄉","元長鄉"],
  "嘉義市": ["東區","西區"],
  "嘉義縣": ["番路鄉","梅山鄉","竹崎鄉","阿里山鄉","中埔鄉","大埔鄉","水上鄉","鹿草鄉","太保市","朴子市","東石鄉","六腳鄉","新港鄉","民雄鄉","大林鎮","溪口鄉","義竹鄉","布袋鎮"],
  "屏東縣": ["屏東市","三地門鄉","霧台鄉","瑪家鄉","九如鄉","里港鄉","高樹鄉","鹽埔鄉","長治鄉","麟洛鄉","竹田鄉","內埔鄉","萬丹鄉","潮州鎮","泰武鄉","來義鄉","萬巒鄉","崁頂鄉","新埤鄉","南州鄉","林邊鄉","東港鎮","琉球鄉","佳冬鄉","新園鄉","枋寮鄉","枋山鄉","春日鄉","獅子鄉","車城鄉","牡丹鄉","恆春鎮","滿州鄉"],
  "宜蘭縣": ["宜蘭市","頭城鎮","礁溪鄉","壯圍鄉","員山鄉","羅東鎮","三星鄉","大同鄉","五結鄉","冬山鄉","蘇澳鎮","南澳鄉"],
  "花蓮縣": ["花蓮市","新城鄉","秀林鄉","吉安鄉","壽豐鄉","鳳林鎮","光復鄉","豐濱鄉","瑞穗鄉","萬榮鄉","玉里鎮","卓溪鄉","富里鄉"],
  "台東縣": ["台東市","綠島鄉","蘭嶼鄉","延平鄉","卑南鄉","鹿野鄉","關山鎮","海端鄉","池上鄉","東河鄉","成功鎮","長濱鄉","太麻里鄉","金峰鄉","大武鄉","達仁鄉"],
  "澎湖縣": ["馬公市","西嶼鄉","望安鄉","七美鄉","白沙鄉","湖西鄉"],
  "金門縣": ["金沙鎮","金湖鎮","金寧鄉","金城鎮","烈嶼鄉","烏坵鄉"],
  "連江縣": ["南竿鄉","北竿鄉","莒光鄉","東引鄉"]

};


export default function CreateActivityPage() {
  const router = useRouter();

  const [category, setCategory] = useState<"找牌咖" | "找旅伴/玩伴" | null>(null);

  const [form, setForm] = useState({
    title: "",
    date: "",
    city: "",
    district: "",
    extraAddr: "",
    contactPhone: "",
    description: "",
    capacity: "", // ⭐ 新增：名額（可填可不填）
  });

  const [districtSearch, setDistrictSearch] = useState("");

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* ===================== 時間限制：不可選過去 ===================== */
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  /* ===================== 區域搜尋 ===================== */
  const filteredDistricts = useMemo(() => {
    if (!form.city) return [];
    const list = taiwanCities[form.city];

    if (!districtSearch.trim()) return list;

    return list.filter((d) => d.includes(districtSearch.trim()));
  }, [form.city, districtSearch]);

  /* ===================== 時間格式化（送出用） ===================== */
  function formatDateTime(datetime: string) {
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return datetime;
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const hh = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  }

  /* ===================== 表單驗證 ===================== */
  function validate() {
    if (!category) return "請先選擇分類";

    if (!form.title.trim() || form.title.trim().length < 2) {
      return "活動名稱至少 2 個字";
    }

    if (!form.date) return "請選擇日期時間";
    if (!form.city) return "請選擇縣市";
    if (!form.district) return "請選擇區域";

    // 電話驗證 & 限制 10 碼
    if (!/^09\d{8}$/.test(form.contactPhone.trim())) {
      return "請輸入正確的手機格式（09 開頭，共 10 碼）";
    }

    // capacity 可不填，但如果有填 → 必須是正整數
    if (form.capacity && !/^[1-9]\d*$/.test(form.capacity)) {
      return "名額必須是正整數";
    }

    return null;
  }

  /* ===================== 送出 ===================== */
  async function handleSubmit() {
    const err = validate();
    if (err) return alert(err);

    const fullLocation = `${form.city}${form.district}${form.extraAddr ?? ""}`;

    const formattedDate = formatDateTime(form.date);

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        date: formattedDate,
        location: fullLocation,
        contactPhone: form.contactPhone,
        description: form.description,
        category,
        capacity: form.capacity ? Number(form.capacity) : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "建立失敗");

    router.push("/activities");
  }

  /* ===================== 電話長度限制（不能超過 10 碼） ===================== */
  function handlePhoneInput(v: string) {
    if (v.length <= 10) updateField("contactPhone", v);
  }

  /* ===================================================== */

  return (
    <main className="create-wrapper">

      {/* ======= 選分類 ======= */}
      <div className="create-category-row">
        <div
          className={`create-card ${category === "找牌咖" ? "active" : ""}`}
          onClick={() => setCategory("找牌咖")}
        >
          <div className="find-card-icon"></div>
          <div className="create-card-title">找牌咖</div>
          <div className="create-card-sub">麻將、橋牌、象棋…</div>
        </div>

        <div
          className={`create-card travel ${category === "找旅伴/玩伴" ? "active" : ""}`}
          onClick={() => setCategory("找旅伴/玩伴")}
        >
          <img src="/travel.png" className="create-card-img" />
          <div className="create-card-title">找旅伴/玩伴</div>
          <div className="create-card-sub">散步、運動、郊遊</div>
        </div>
      </div>

      {/* ======= 表單內容 ======= */}
      <div className="create-form-box">

        {/* 活動名稱（必填） */}
        <div className="form-row">
          <label>
            活動名稱<span style={{ color: "red" }}>＊</span>
          </label>
          <input
            className="form-input"
            placeholder="例如：一起打麻將！"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>

        {/* 日期時間 */}
        <div className="form-row">
          <label>日期時間<span style={{ color: "red" }}>＊</span></label>
          <input
            type="datetime-local"
            min={minDateTime}
            className="form-input"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
          />
        </div>

        {/* 縣市 */}
        <div className="form-row">
          <label>縣市<span style={{ color: "red" }}>＊</span></label>
          <select
            className="form-input"
            value={form.city}
            onChange={(e) => {
              updateField("city", e.target.value);
              updateField("district", "");
              setDistrictSearch("");
            }}
          >
            <option value="">請選擇</option>
            {Object.keys(taiwanCities).map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* 區域（搜尋 + 下拉） */}
        <div className="form-row">
          <label>區域<span style={{ color: "red" }}>＊</span></label>

          <input
            className="form-input"
            style={{ width: "60%", marginBottom: "6px" }} // ⭐ 搜尋框變短
            placeholder="搜尋區域名稱…"
            value={districtSearch}
            onChange={(e) => setDistrictSearch(e.target.value)}
          />

          <select
            className="form-input"
            style={{ width: "100%" }} // ⭐ 下拉框變長
            value={form.district}
            onChange={(e) => updateField("district", e.target.value)}
          >
            <option value="">請選擇</option>
            {filteredDistricts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 補充地址 */}
        <div className="form-row">
          <label>更多地址</label>
          <input
            className="form-input"
            placeholder="例如：中山路 99 號"
            value={form.extraAddr}
            onChange={(e) => updateField("extraAddr", e.target.value)}
          />
        </div>

        {/* 名額 */}
        <div className="form-row">
          <label>名額</label>
          <input
            type="number"
            min="1"
            className="form-input"
            placeholder="例如：4"
            value={form.capacity}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== "" && Number(v) < 1) return;
              updateField("capacity", v);
            }}
          />
        </div>

        {/* 電話 */}
        <div className="form-row">
          <label>聯絡電話<span style={{ color: "red" }}>＊</span></label>
          <input
            className="form-input"
            placeholder="例如：0912345678"
            value={form.contactPhone}
            onChange={(e) => handlePhoneInput(e.target.value)}
          />
        </div>

        {/* 活動說明 */}
        <div className="form-row">
          <label>活動說明</label>
        </div>
        <textarea
          className="form-textarea"
          placeholder="例如：三缺一等你加入～"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        {/* 按鈕 */}
        <div className="create-btn-row">
          <button className="btn-cancel" onClick={() => router.push("/activities")}>
            取消
          </button>
          <button className="btn-submit" onClick={handleSubmit}>
            建立活動
          </button>
        </div>
      </div>
    </main>
  );
}
