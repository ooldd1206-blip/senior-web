"use client";

import Image from "next/image";
import Link from "next/link";
import "../globals.css";

export default function HomePage() {
  return (
    <main className="home-container">

      <div className="home-two-cards">

        {/* 一對一聊天 */}
        <div className="home-card">
          <Link href="/discovery" className="home-card-link">
            <Image
              src="/match.png"
              alt="配對便利貼"
              width={520}
              height={600}
              className="home-card-bg"
            />

            {/* 按鈕 */}
            <div className="home-button">配對</div>
          </Link>
        </div>

        {/* 找活動 */}
        <div className="home-card">
          <Link href="/activities" className="home-card-link">
            <Image
              src="/event.png"
              alt="活動便利貼"
              width={520}
              height={600}
              className="home-card-bg"
            />

            {/* 按鈕 */}
            <div className="home-button">加入</div>
          </Link>
        </div>

      </div>
    </main>
  );
}
