"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";


type Msg = {
  id?: string;
  senderId: string;
  receiverId: string;
  content?: string;
  createdAt: string;
  imageUrl?: string;
  audioUrl?: string;
  read?: boolean;
};

// ⭐ 聊天室活動小卡用的精簡型別
type ActivityPreview = {
  id: string;
  title: string;
  description?: string | null; 
  date: string;
  location: string;
  category: string;
};


let socket: Socket | null = null;

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const otherId = params.id as string;
const search = useSearchParams();
const activityId = search.get("activityId");
const [showActivity, setShowActivity] = useState(true);






  const [me, setMe] = useState<string>("");
  const [otherName, setOtherName] = useState("聊天室");
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [list, setList] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [activityInfo, setActivityInfo] = useState<ActivityPreview | null>(null);

// 選圖片 + 本地預覽（不動你原本 sendImage）
function handleImageSelect(e: any) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => setPreviewImage(reader.result as string);
  reader.readAsDataURL(file);

  // 再呼叫你原本的 sendImage（不動你的原始功能）
  sendImage(e);
}

  // 取得登入者
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.id) setMe(d.user.id);
      });
  }, []);

  // 取得紀錄
  useEffect(() => {
    fetch(`/api/messages?user=${otherId}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.messages || []);
        setOtherName(d.other?.displayName || "聊天室");
        setOtherAvatar(d.other?.avatarUrl || null);
      });
  }, [otherId]);
  
  useEffect(() => {
    if (!activityId) return;

    fetch(`/api/activities?id=${activityId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.activity) {
          setActivityInfo({
            id: d.activity.id,
            title: d.activity.title,
            date: d.activity.date,
            location: d.activity.location,
            category: d.activity.category,
          });
        }
      });
  }, [activityId]);



// 🔵 Socket：整段拿去取代你現在的那個 useEffect
useEffect(() => {
  if (!me) return;

  // 初始化一次就好，不要把 socket 當作 useEffect 的回傳值
  if (!socket) {
    socket = io("http://localhost:4000");
  }

  socket.emit("join-chat", { me, other: otherId });

  // 注意：這裡先用 any 再 cast，避免跟 socket.io 的型別打架
  const handler = (raw: any) => {
    const msg = raw as Msg;

    if (
      (msg.senderId === me && msg.receiverId === otherId) ||
      (msg.senderId === otherId && msg.receiverId === me)
    ) {
      setList((prev) => [...prev, msg]);
    }
  };

  socket.on("new-message", handler);

  // ⭐ useEffect「只能」回傳 cleanup function，不能回傳 socket 本身
  return () => {
    socket?.off("new-message", handler);
  };
}, [me, otherId]);


  // 捲到底
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [list]);

  // 發送文字
async function send() {
  if (!text.trim()) return;

  const payload = {
    senderId: me,
    receiverId: otherId,
    content: text,
    createdAt: new Date().toISOString(),
  };

  // 1. 本地先顯示（避免等待 Socket）
  setList(prev => [...prev, payload]);

  // 2. 發到後端
  await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      receiverId: otherId,
      content: text,
    }),
  });

  // 3. 發送 socket → 讓對方收到
  socket?.emit("send-message", payload);

  setText("");
}


  // 上傳圖片
  async function sendImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const upload = await fetch("/api/upload", { method: "POST", body: form });
    const result = await upload.json();

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: otherId,
        imageUrl: result.url,
      }),
    });

    socket?.emit("send-message", {
      senderId: me,
      receiverId: otherId,
      imageUrl: result.url,
      createdAt: new Date().toISOString(),
    });
  }

  // 日期分隔線
  function isNewDay(current: string, previous?: string) {
    if (!previous) return true;
    const c = new Date(current);
    const p = new Date(previous);
    return (
      c.getFullYear() !== p.getFullYear() ||
      c.getMonth() !== p.getMonth() ||
      c.getDate() !== p.getDate()
    );
  }

return (
  <main className="bg-[#F6F6F6] h-screen w-screen flex flex-col">
    <div className="max-w-[800px] mx-auto w-full flex flex-col h-screen">

      {/* 🔵 上方固定 bar（用 sticky） */}
      <div className="
        flex items-center gap-4 px-6 py-5 bg-white shadow 
        sticky top-0 z-20
      ">
        <button onClick={() => router.back()} className="text-[30px]">←</button>
        <span className="text-[24px] font-semibold">{otherName}</span>
      </div>


      {activityInfo && (
        <div className="activity-card-box">

          {/* 標題 */}
          <p className="activity-card-title">
            {activityInfo.title}
          </p>

          {/* 描述（如果有） */}
          {activityInfo.description && (
            <p className="activity-card-desc">
              {activityInfo.description}
            </p>
          )}

          {/* 日期 */}
          <div className="activity-card-row mt-2">
            <img src="/date.png" className="activity-card-icon" />
            <span className="activity-card-info">
              {new Date(activityInfo.date).toLocaleString("zh-TW")}
            </span>
          </div>

          {/* 地點 */}
          <div className="activity-card-row mt-3">
            <img src="/place.png" className="activity-card-icon" />
            <span className="activity-card-info">
              {activityInfo.location}
            </span>
          </div>
        </div>
      )}



      {/* 🔵 中間訊息區（唯一可滾動的區域） */}
      <div className="
        flex-1 overflow-y-auto px-8 py-6 space-y-10
      ">
        {list.map((m, idx) => {
          const isMe = m.senderId === me;
          const showDivider = isNewDay(m.createdAt, list[idx - 1]?.createdAt);

          return (
            <div key={idx}>
              {showDivider && (
                <div className="flex items-center my-6 text-gray-500 text-[14px]">
                  <div className="flex-1 h-px bg-gray-300" />
                  <div className="px-4">
                    {new Date(m.createdAt).toLocaleDateString("zh-TW")}
                  </div>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>
              )}

              <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <img
                    src={otherAvatar ?? ""}
                    className="w-[80px] h-[80px] rounded-full object-cover"
                  />
                )}

                <div className="flex flex-col max-w-[70%]">
                  {m.imageUrl && (
                    <img
                      src={m.imageUrl}
                      className={`rounded-2xl mb-2 shadow ${isMe ? "ml-auto" : ""}`}
                      style={{ width: 170 }}
                    />
                  )}

                  {m.content && (
                    <div
                      className={
                        "chat-bubble " +
                        (isMe ? "chat-bubble-right" : "chat-bubble-left")
                      }
                    >
                      {m.content}
                    </div>
                  )}
                <div className={`${isMe ? "text-right" : "text-left"} text-[11px] text-gray-400`}>
                  
                  {new Date(m.createdAt).toLocaleTimeString("zh-TW", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                  {isMe && m.read && (
                    <span className="text-right text-[12px] text-gray-500 mt-1">
                      已讀
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* 🔵 下方固定輸入框（sticky，不會跳出去） */}
      {/* 🔵 下方固定輸入框（sticky，不會跳出去） */}
      <div className="
        sticky bottom-0 bg-[#F6F6F6] px-8 pb-6 pt-4 z-20
      ">
        
        {/* 🟦 圖片預覽（有選圖片才會出現） */}
        {previewImage && (
          <div className="mb-3 px-2">
            <img
              src={previewImage}
              className="w-[120px] h-[120px] object-cover rounded-2xl shadow"
            />
          </div>
        )}

        <div className="flex items-center bg-white rounded-full px-[30px] py-[20px] shadow-xl gap-[15px] ">
          
          {/* 📷 圖片 icon（保留你的 UI 不動） */}
          <label className="text-[28px] cursor-pointer">
            <img
              src="/upload.png"
              className="w-[45px] h-[45px] opacity-70 hover:opacity-90 transition"
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}   // ← 改用新方法（不影響你原本 sendImage）
            />
          </label>

          {/* ✏️ 多行輸入框（取代 input，所有 UI 保留不變） */}
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="輸入訊息…"
            className="
              flex-1
              bg-[#F9F9F9]
              text-[24px]
              px-[12px] py-[10px]
              rounded-full
              border border-gray-300
              outline-none
              placeholder-gray-400
              resize-none
            "
          ></textarea>

          {/* 📩 紙飛機送出按鈕（有文字變綠色、沒文字變灰） */}
          <button
            onClick={send}
            disabled={!text.trim()}
            className="transition"
          >
            <img
              src={text.trim() ? "/send-green.png" : "/send.png"}
              className={`w-[45px] h-[45px] ${text.trim() ? "" : "opacity-50"}`}
            />
          </button>


        </div>
      </div>


    </div>
  </main>
);


}
