/**
 * POST /api/upload
 * 圖片上傳 API
 * - UPLOAD_PROVIDER=local  → public/uploads（本地開發）
 * - UPLOAD_PROVIDER=cloudinary → Cloudinary（Vercel 生產環境）
 */
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function uploadToCloudinary(buffer: Buffer, ext: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "japan-buy-helper";

  // Build signature
  const paramStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHmac("sha256", apiSecret)
    .update(`folder=${folder}&timestamp=${timestamp}`)
    .digest("hex");

  // Use SHA1 as Cloudinary expects (SHA1 of sorted params + secret)
  const { createHash } = await import("crypto");
  const sig = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  void paramStr; void signature;

  const formData = new FormData();
  const arrayBuf = Buffer.from(buffer).buffer as ArrayBuffer;
  const blob = new Blob([arrayBuf], { type: `image/${ext}` });
  formData.append("file", blob, `upload.${ext}`);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("signature", sig);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

async function uploadToLocal(buffer: Buffer, ext: string): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { randomBytes } = await import("crypto");
  const path = await import("path");

  const filename = `${randomBytes(12).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "未提供檔案" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "僅支援 JPG / PNG / WebP / GIF" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sizeMB = buffer.byteLength / (1024 * 1024);

    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json(
        { success: false, error: `檔案不可超過 ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const provider = process.env.UPLOAD_PROVIDER || "local";

    let url: string;
    if (provider === "cloudinary") {
      url = await uploadToCloudinary(buffer, ext);
    } else {
      url = await uploadToLocal(buffer, ext);
    }

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { success: false, error: "上傳失敗，請重試" },
      { status: 500 }
    );
  }
}
