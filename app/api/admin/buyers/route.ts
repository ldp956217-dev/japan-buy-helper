import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/buyers - 購買人彙總 */
export async function GET() {
  try {
    const guests = await prisma.guest.findMany({
      include: {
        reservations: {
          where: { status: "CONFIRMED" },
          select: { quantity: true, totalAmount: true, reservedAt: true },
          orderBy: { reservedAt: "desc" },
        },
      },
    });

    const buyers = guests
      .filter((g) => g.reservations.length > 0)
      .map((g) => ({
        id: g.id,
        nickname: g.nickname,
        guestToken: g.guestToken,
        reservationCount: g.reservations.length,
        totalItems: g.reservations.reduce((s, r) => s + r.quantity, 0),
        totalAmount: g.reservations.reduce((s, r) => s + r.totalAmount, 0),
        lastReservationAt: g.reservations[0]?.reservedAt?.toISOString() || null,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return NextResponse.json({ success: true, data: buyers });
  } catch (error) {
    console.error("[GET /api/admin/buyers]", error);
    return NextResponse.json(
      { success: false, error: "取得購買人資料失敗" },
      { status: 500 }
    );
  }
}
