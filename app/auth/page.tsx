"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // 判斷 email 驗證跳轉回來
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "1") {
      setMode("login");
      setMessage("✅ Email 驗證成功！請登入");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: mode,
        email,
        password,
        displayName,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "發生錯誤");
      return;
    }

    /** ✨ 註冊成功 */
    if (mode === "register") {
      setMessage("✉️ 註冊成功！請前往信箱驗證後再登入！");
      setPassword("");
      setMode("login");
      return;
    }

    /** ✔ 登入成功 → 首頁 */
    if (mode === "login") {
      setMessage("登入成功！跳轉中...");
      setTimeout(() => router.push("/home"), 500);
    }
  }

  return (
    <main className="bg-grid">

      {/* ======================
          註冊／登入便利貼
      ====================== */}
      <div className="register-memo-wrap">
        <Image
          src="/memo.png"
          alt="memo"
          width={900}
          height={900}
          className="memo-img"
          priority
        />

        {/* 內容 */}
        <div className="register-content">
          <h1 className="register-title">
            {mode === "login" ? "登入" : "註冊"}
          </h1>

          <form onSubmit={handleSubmit} className="register-form">

            {mode === "register" && (
              <div className="row">
                <label>暱稱</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="row">
              <label>帳號</label>
              <input
                type="email"
                value={email}
                placeholder="請輸入電子郵件"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="row">
              <label>密碼</label>
              <input
                type="password"
                value={password}
                placeholder={
                  mode === "register"
                    ? "至少 8 碼，需含英文與數字"
                    : "請輸入密碼"
                }
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="register-buttons">
              {mode === "login" && (
                <button
                  type="button"
                  className="auth-btn auth-btn-pink"
                  onClick={() => router.push("/forgot-password")}
                >
                  忘記密碼
                </button>
              )}

              <button type="submit" className="auth-btn auth-btn-green">
                {loading ? "處理中..." : mode === "login" ? "登入" : "註冊"}
              </button>
            </div>

            {message && (
              <p className="register-message">{message}</p>
            )}

            {/* 下面的切換按鈕 */}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
              }}
              className="mt-4 text-blue-600 underline text-lg"
            >
              {mode === "login"
                ? "沒有帳號？註冊一個"
                : "已有帳號？登入"}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}
