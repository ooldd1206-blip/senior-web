// app/api/upload/route.ts
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "沒有檔案" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 把檔案轉成 buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 檔名處理
    const fileName =
      Date.now() + "-" + file.name.replace(/\s+/g, "_");

    // public/uploads 底下
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // 確保資料夾存在
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);

    // 寫入檔案
    await writeFile(filePath, buffer);

    // 前端可以直接用的網址
    const url = `/uploads/${fileName}`;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("上傳失敗", err);
    return new Response(JSON.stringify({ error: "上傳失敗" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
