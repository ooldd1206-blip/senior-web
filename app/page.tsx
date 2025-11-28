"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="bg-grid">

      {/* ===========================
            首頁便利貼
      =========================== */}
      <div className="memo-wrap">
        <Image src="/memo.png" width={900} height={900} alt="memo" className="memo-img"/>

        <div className="memo-content">
          <Image src="/logo.png" width={160} height={160} alt="logo" className="memo-logo"/>

          <h1 className="memo-title">
            <span className="logo-text-pink">老友</span>
            <span className="logo-text-blue">友老</span>
          </h1>

          <div className="memo-buttons">
            <button
              type="button"
              className="home-btn home-btn-blue"
              onClick={() => setShowLogin(true)}
            >
              登入 / 註冊
            </button>
          </div>
        </div>
      </div>

      {/* ===========================
            Google 登入彈跳便利貼
      =========================== */}
      {showLogin && (
        <div className="login-overlay">
          <div className="login-memo-wrap">

            <Image src="/memo.png" width={900} height={900} alt="memo" className="login-memo-img"/>

            <div className="login-memo-content">

              <h1 className="auth-title">登入 / 註冊</h1>

              <button
                className="google-register-btn"
                onClick={() => window.location.href = "/api/auth/google"}
              >
                <Image src="/google-logo.png" width={36} height={36} alt="Google icon"/>
                <span>使用 Google 登入</span>
              </button>

              <button className="home-back-btn" onClick={() => setShowLogin(false)}>
                <Image src="/black-arrow.png" width={130} height={130} alt="back" className="home-back-arrow"/>
                <div className="home-back-label">回首頁</div>
              </button>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}
