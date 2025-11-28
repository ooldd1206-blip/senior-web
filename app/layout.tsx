import type { Metadata } from "next";
import "./globals.css";
import NavBarWrapper from "@/components/ui/NavBarWrapper";
import BackgroundWrapper from "@/components/ui/BackgroundWrapper";

export const metadata: Metadata = {
  title: "老友友老",
  description: "樂齡友善交友平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        {/* ⭐ 背景先包起來 */}
        <BackgroundWrapper>

          {/* ⭐ NavBar + 外框都交給 NavBarWrapper 控制 */}
          <NavBarWrapper />

          {/* ⭐ 其他頁面的內容 */}
          {children}

        </BackgroundWrapper>
      </body>
    </html>
  );
}
