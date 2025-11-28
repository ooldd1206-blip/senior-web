"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("處理中...");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setMsg(data.message || data.error || "");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center"
      >
        <h1 className="text-3xl font-bold mb-6">重設密碼</h1>

        <input
          type="password"
          placeholder="新密碼（至少 8 碼，含英文與數字）"
          className="w-full p-3 border rounded-lg text-lg mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-400 hover:bg-blue-500 text-white text-xl py-3 rounded-lg"
        >
          更新密碼
        </button>

        <p className="mt-4 text-neutral-700">{msg}</p>
      </form>
    </main>
  );
}
