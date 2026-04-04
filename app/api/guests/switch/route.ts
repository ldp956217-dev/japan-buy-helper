import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nickname: z.string().min(1).max(20),
});

/**
 * POST /api/guests/switch
 * 以暱稱為 key 查詢或建立 Guest，回傳對應的 guestToken。
 * 同暱稱永遠對應同一個身份。
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "請求資料格式錯誤" },
        { status: 400 }
      );
    }

    const { nickname } = parsed.data;

    // 用 nickname 查找，找不到就建立（guestToken 用 crypto.randomUUID()）
    let guest = await prisma.guest.findFirst({ where: { nickname } });
    if (!guest) {
      guest = await prisma.guest.create({
        data: { guestToken: crypto.randomUUID(), nickname },
      });
    }

    return NextResponse.json({
      success: true,
      data: { guestToken: guest.guestToken, nickname: guest.nickname },
    });
  } catch (error) {
    console.error("[POST /api/guests/switch]", error);
    return NextResponse.json(
      { success: false, error: "操作失敗" },
      { status: 500 }
    );
  }
}
