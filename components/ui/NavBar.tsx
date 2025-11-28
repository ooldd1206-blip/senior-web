"use client";

import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <div className="top-nav-wrapper">
      <div className="top-nav-border">

        {/* Logo */}
        <Link href="/home">
          <Image
            src="/logo2.png"
            alt="logo"
            width={180}
            height={180}
            className="nav-icon nav-logo"
          />
        </Link>

        {/* Nav links */}
        <div className="nav-links">

          <Link href="/discovery">
            <Image
              src="/match-logo.png"
              alt="match"
              width={150}
              height={150}
              className="nav-icon"
            />
          </Link>

          <Link href="/activities">
            <Image
              src="/event-logo.png"
              alt="event"
              width={150}
              height={150}
              className="nav-icon"
            />
          </Link>

          <Link href="/chat">
            <Image
              src="/chat-logo.png"
              alt="chat"
              width={150}
              height={150}
              className="nav-icon"
            />
          </Link>

          <Link href="/profile">
            <Image
              src="/aboutme-logo.png"
              alt="me"
              width={150}
              height={150}
              className="nav-icon"
            />
          </Link>

        </div>
      </div>
    </div>
  );
}
