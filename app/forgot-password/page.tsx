"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("處理中...");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
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
        <h1 className="text-3xl font-bold mb-6">忘記密碼</h1>

        <input
          type="email"
          placeholder="電子郵件"
          className="w-full p-3 border rounded-lg text-lg mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-400 hover:bg-blue-500 text-white text-xl py-3 rounded-lg"
        >
          寄送重設密碼信
        </button>

        <p className="mt-4 text-neutral-700">{msg}</p>
      </form>
    </main>
  );
}
