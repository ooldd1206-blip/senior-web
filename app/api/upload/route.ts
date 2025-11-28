// app/api/upload/route.ts
import { v2 as cloudinary } from "cloudinary";

// 先把 env 抓出來，等等一起檢查
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export async function POST(req: Request) {
  console.log("🚀 Cloudinary upload route HIT");
  try {
    // 檢查 Cloudinary 環境變數是否有設定
    if (!cloudName || !apiKey || !apiSecret) {
      console.error("❌ Cloudinary env not set", {
        cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
      });

      return Response.json(
        { error: "伺服器尚未設定 Cloudinary 環境變數" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "沒有檔案" }, { status: 400 });
    }

    // 把檔案轉成 buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上傳到 Cloudinary（用 upload_stream）
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "senior-web", // 你可以改成自己想要的資料夾名稱
          },
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    const url = (uploadResult as any).secure_url as string;

    // 回傳 Cloudinary 的網址給前端
    return Response.json({ url }, { status: 200 });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return Response.json({ error: "上傳失敗" }, { status: 500 });
  }
}
