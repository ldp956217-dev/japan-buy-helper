import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/me/reservations?guestToken=xxx */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const guestToken = url.searchParams.get("guestToken");

    if (!guestToken) {
      return NextResponse.json(
        { success: false, error: "缺少 guestToken" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { guestToken },
    });

    if (!guest) {
      // 尚未建立 guest，回傳空陣列
      return NextResponse.json({
        success: true,
        data: { reservations: [], totalItems: 0, totalAmount: 0 },
      });
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        guestId: guest.id,
        status: "CONFIRMED",
      },
      orderBy: { reservedAt: "desc" },
    });

    const totalItems = reservations.reduce((s, r) => s + r.quantity, 0);
    const totalAmount = reservations.reduce((s, r) => s + r.totalAmount, 0);

    // 序列化 Date
    const serialized = reservations.map((r) => ({
      ...r,
      reservedAt: r.reservedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: { reservations: serialized, totalItems, totalAmount },
    });
  } catch (error) {
    console.error("[GET /api/me/reservations]", error);
    return NextResponse.json(
      { success: false, error: "取得預定記錄失敗" },
      { status: 500 }
    );
  }
}
