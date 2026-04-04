import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  guestToken: z.string().min(1),
  nickname: z.string().min(1).max(20),
});

/** POST /api/guests/upsert */
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

    const { guestToken, nickname } = parsed.data;

    const guest = await prisma.guest.upsert({
      where: { guestToken },
      update: { nickname },
      create: { guestToken, nickname },
    });

    return NextResponse.json({ success: true, data: { id: guest.id, nickname: guest.nickname } });
  } catch (error) {
    console.error("[POST /api/guests/upsert]", error);
    return NextResponse.json(
      { success: false, error: "操作失敗" },
      { status: 500 }
    );
  }
}
