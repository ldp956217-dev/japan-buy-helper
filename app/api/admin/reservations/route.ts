import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/reservations */
export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { reservedAt: "desc" },
      include: {
        guest: { select: { nickname: true, guestToken: true } },
        product: { select: { serialNo: true } },
      },
    });

    const serialized = reservations.map((r) => ({
      ...r,
      reservedAt: r.reservedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    console.error("[GET /api/admin/reservations]", error);
    return NextResponse.json(
      { success: false, error: "取得預定明細失敗" },
      { status: 500 }
    );
  }
}
