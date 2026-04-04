import { NextResponse } from "next/server";
import { z } from "zod";
import { createReservation } from "@/services/reservation";

const schema = z.object({
  productId: z.string().min(1),
  guestToken: z.string().min(1),
  nickname: z.string().min(1).max(20),
  quantity: z.number().int().min(1),
});

/** POST /api/reservations - 建立預定（含防超賣邏輯） */
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

    const result = await createReservation(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 409 } // Conflict（庫存不足）
      );
    }

    return NextResponse.json({
      success: true,
      data: result.reservation,
      message: "預定成功",
    });
  } catch (error) {
    console.error("[POST /api/reservations]", error);
    return NextResponse.json(
      { success: false, error: "建立預定時發生錯誤" },
      { status: 500 }
    );
  }
}
